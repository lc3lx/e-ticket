import { fcm } from '../modules/firebase';
import UserDevice from '../models/userDevice.model';
import Notification from '../models/notification.model';
import NotificationTypes from '../common/enums/notificationTypes.enum';

interface NotificationPayload {
  title: string;
  body: string;
  data: { [key: string]: string };
  type: NotificationTypes;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isUnrecoverable(code?: string): boolean {
  return code === 'messaging/invalid-registration-token' || code === 'messaging/registration-token-not-registered';
}

function isRetryable(code?: string): boolean {
  return (
    code === 'messaging/internal-error' ||
    code === 'messaging/unavailable' ||
    code === 'messaging/server-unavailable' ||
    code === 'messaging/quota-exceeded'
  );
}

export class PushNotificationService {
  static async sendToUser(userId: number, payload: NotificationPayload, userType: string) {
    const devices = await UserDevice.findAll({ where: { userId } });
    const tokens = devices.map((d) => d.fcmToken).filter(Boolean);

    if (tokens.length === 0) return console.log(`No device tokens found for userId ${userId}. Skipping notification.`);

    const tokenToUser = Object.fromEntries(tokens.map((t) => [t, { userId, userType }]));

    const message = {
      notification: { title: payload.title, body: payload.body },
      data: payload.data || {},
      tokens,
    };
    await this._sendWithRetry(message, tokens, tokenToUser, payload);
  }

  static async sendToUsers(userIds: number[], payload: NotificationPayload, userType: string) {
    const devices = await UserDevice.findAll({ where: { userId: userIds } });
    const tokens: string[] = [];
    const tokenToUser: Record<string, { userId: number; userType: string }> = {};

    for (const device of devices) {
      const token = device.fcmToken;
      if (!token) continue;
      tokens.push(token);
      tokenToUser[token] = { userId: device.userId, userType };
    }

    if (tokens.length === 0) return console.log(`No device tokens found for users ${userIds}. Skipping notification.`);

    const chunkSize = 500;
    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize);
      const message = {
        notification: { title: payload.title, body: payload.body },
        data: payload.data || {},
        tokens: chunk,
      };

      await this._sendWithRetry(message, chunk, tokenToUser, payload);
    }
  }

  static async sendToManyOrBroadCast(payload: NotificationPayload, userType: string) {
    const devices = await UserDevice.findAll();
    const tokens: string[] = [];
    const tokenToUser: Record<string, { userId: number; userType: string }> = {};

    for (const device of devices) {
      const token = device.fcmToken;
      if (!token) continue;
      tokens.push(token);
      tokenToUser[token] = { userId: device.userId, userType };
    }
    if (tokens.length === 0) return console.log('No device tokens found for broadcast.');

    const chunkSize = 500;
    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize);

      const message = {
        notification: { title: payload.title, body: payload.body },
        data: payload.data || {},
        tokens: chunk,
      };

      await this._sendWithRetry(message, chunk, tokenToUser, payload);
    }
  }

  private static async _sendWithRetry(
    message: any,
    tokens: string[],
    tokenToUser: Record<string, { userId: number; userType: string }>,
    payload: NotificationPayload,
    maxRetries = 3,
    delayMs = 1000,
  ) {
    // const notificationInstances: Record<string, Notification> = {};
    const notificationByUserId: Record<number, Notification> = {};

    // for (const token of tokens) {
    //   const userContext = tokenToUser[token];
    //   if (!userContext) continue;

    //   const notification = await Notification.create({
    //     userId: userContext.userId,
    //     userType: userContext.userType,
    //     title: payload.title,
    //     body: payload.body,
    //     sendDate: new Date(),
    //     markAsReaded: false,
    //     data: payload.data,
    //     type: payload.type,
    //   });

    //   notificationInstances[token] = notification;
    // }

    for (const token of tokens) {
      const userContext = tokenToUser[token];
      if (!userContext) continue;

      if (!notificationByUserId[userContext.userId]) {
        notificationByUserId[userContext.userId] = await Notification.create({
          userId: userContext.userId,
          userType: userContext.userType,
          title: payload.title,
          body: payload.body,
          sendDate: new Date(),
          markAsReaded: false,
          data: payload.data,
          type: payload.type,
        });
      }
    }

    for (const token of tokens) {
      // const notification = notificationInstances[token];
      // if (!notification) continue;

      const userContext = tokenToUser[token];
      if (!userContext) continue;

      const notification = notificationByUserId[userContext.userId];
      if (!notification) continue;

      const message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          ...payload.data,
          notificationId: notification.id.toString(),
        },
      };

      let attempt = 0;
      while (attempt < maxRetries) {
        try {
          await fcm.send(message);
          break;
        } catch (err: any) {
          const code = err?.code;
          if (isUnrecoverable(code)) {
            await UserDevice.destroy({ where: { fcmToken: token } });
            console.warn(`🗑️ Removed invalid token: ${token}`);
            break;
          } else {
            attempt++;
            if (attempt < maxRetries) {
              console.warn(`⚠️ Retry ${attempt}/${maxRetries} for ${token}: ${code}`);
              await sleep(delayMs * Math.pow(2, attempt));
            } else {
              console.warn(`⚠️ Error for ${token}: ${code}`);
            }
          }
        }
      }
    }
  }
}
