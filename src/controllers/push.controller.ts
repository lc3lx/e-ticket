import { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import UserDevice from '../models/userDevice.model';
import EventType from '../models/eventType.model';
import Province from '../models/provinces.model';
import NormalUser from '../models/normalUser.model';
import { Supervisor } from '../models/supervisor.model';
import { PushNotificationService } from '../services/push.service';
import notificationService from '../services/notification.service';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import catchAsync from '../utils/catchAsync';
import { errorMessage } from '../modules/i18next.config';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response.js';
import NotificationTypes from '../common/enums/notificationTypes.enum';
import { CreateNotificationAdminDTO } from '../interfaces/notification/notificationAdmin.dto';
import AppError from '../utils/AppError';
import Gender from '../common/enums/gender.enum';

type RegisterPushTokenBody = {
  fcmToken: string;
  platform: 'android' | 'ios';
  deviceId?: string;
  appVersion?: string;
};

interface UserNotification {
  eventTypeIds?: number[];
  provinceIds?: number[];
  provinceId?: number;
  gender?: Gender;
  minAge?: number;
  maxAge?: number;
}

export const registerPushToken = catchAsync(async (req: CustomRequest, res: Response) => {
  const userId = req.notificationUser;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { fcmToken, platform, deviceId, appVersion } = req.body as unknown as RegisterPushTokenBody;

  if (!fcmToken || !platform) {
    return res.status(400).json({ message: 'fcmToken and platform are required' });
  }

  try {
    const [device, created] = await UserDevice.findOrCreate({
      where: {
        userId,
        fcmToken,
      },
      defaults: {
        userId,
        fcmToken,
        platform,
        deviceId,
        appVersion,
        lastActiveAt: new Date(),
      },
    });

    if (!created) {
      device.fcmToken = fcmToken;
      device.platform = platform;
      device.appVersion = appVersion;
      device.lastActiveAt = new Date();
      await device.save();
    }

    return res.status(200).json({
      message: created ? 'Device registered' : 'Device updated',
      deviceId: device.deviceId,
    });
  } catch (err) {
    console.error('Register push token failed:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export const sendNotificationsForUsers = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { eventTypeIds, provinceIds, minAge, maxAge, gender }: UserNotification = req.body;

  const { title, body, data } = req.body;

  if (!title) return next(new AppError(errorMessage('error.NotificationTitle'), 400));
  if (!body) return next(new AppError(errorMessage('error.NotificationBody'), 400));

  const today = new Date();
  const minBirthDate = new Date(today.getFullYear() - maxAge!, today.getMonth(), today.getDate());
  const maxBirthDate = new Date(today.getFullYear() - minAge!, today.getMonth(), today.getDate());

  const whereClause: any = {};
  if (gender) whereClause.gender = gender;
  if (minAge && maxAge) whereClause.birthDate = { [Op.between]: [minBirthDate, maxBirthDate] };

  const users = await NormalUser.findAll({
    where: whereClause,
    attributes: ['id', 'userId', 'mobileNumber'],
    include: [
      {
        model: EventType,
        as: 'eventTypes',
        where: eventTypeIds ? { id: { [Op.in]: eventTypeIds } } : undefined,
        through: { attributes: [] },
        required: !!eventTypeIds,
      },
      {
        model: Province,
        as: 'provinces',
        where: provinceIds ? { id: { [Op.in]: provinceIds } } : undefined,
        through: { attributes: [] },
        required: !!provinceIds,
      },
    ],
  });

  await Promise.all(
    users.map(async (user) => {
      const { userId } = user;
      const mobileNumber = user.mobileNumber;

      const payload = {
        title,
        body,
        data: {
          ...data,
          type: NotificationTypes.BROADCASTFORUSER,
          uniqueValue: mobileNumber,
        },
        type: NotificationTypes.BROADCASTFORUSER,
      };

      await PushNotificationService.sendToUser(userId, payload, 'normalUser');
    }),
  );

  const notificationAdminData: CreateNotificationAdminDTO = {
    title: title,
    body: body,
    targetedUsersType: 'normalUser',
    eventTypeIds,
    provinceIds,
    minAge,
    maxAge,
    gender,
  };

  await notificationService.saveNotificationAdmin(req, next, notificationAdminData);

  const successResponse: DefaultSuccessResponse = {
    ...defaultSuccessResponse(),
    data: { users },
  };
  res.status(200).json(successResponse);
});

export const sendNotificationsForSupervisors = catchAsync(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { eventTypeIds, provinceIds }: UserNotification = req.body;

    const { title, body, data } = req.body;

    if (!title) return next(new AppError(errorMessage('error.NotificationTitle'), 400));
    if (!body) return next(new AppError(errorMessage('error.NotificationBody'), 400));

    const whereClause: any = {};
    // if (provinceId) whereClause.province = provinceId;
    if (provinceIds?.length) {
      whereClause.province = {
        [Op.in]: provinceIds,
      };
    }

    const supervisors = await Supervisor.findAll({
      where: whereClause,
      attributes: ['id', 'userId', 'username', 'province'],
      include: [
        {
          model: EventType,
          as: 'eventTypes',
          where: eventTypeIds ? { id: { [Op.in]: eventTypeIds } } : undefined,
          through: { attributes: [] },
          required: !!eventTypeIds,
        },
        {
          model: Province,
          as: 'provinceRelation',
          required: !!provinceIds,
        },
      ],
    });

    await Promise.all(
      supervisors.map(async (supervisor) => {
        const { userId } = supervisor;
        const username = supervisor.username;

        const payload = {
          title,
          body,
          data: {
            ...data,
            type: NotificationTypes.BROADCASTFORSUPERVISOR,
            uniqueValue: username,
          },
          type: NotificationTypes.BROADCASTFORSUPERVISOR,
        };

        await PushNotificationService.sendToUser(userId, payload, 'supervisor');
      }),
    );

    const notificationAdminData: CreateNotificationAdminDTO = {
      title: title,
      body: body,
      targetedUsersType: 'supervisor',
      eventTypeIds,
    };

    await notificationService.saveNotificationAdmin(req, next, notificationAdminData);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { supervisors },
    };
    res.status(200).json(successResponse);
  },
);
