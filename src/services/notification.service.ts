import { NextFunction } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import Notification from '../models/notification.model';
import NotificationAdmin from '../models/notificationAdmin.model';
import APIFeatures from '../utils/apiFeatures';
import catchAsyncNext from '../utils/catchAsyncReqNext';
import AppError from '../utils/AppError';
import { errorMessage } from '../modules/i18next.config';
import { CreateNotificationAdminDTO } from '../interfaces/notification/notificationAdmin.dto';
import validateFieldsNames from '../utils/validateFields';
import Province from '../models/provinces.model';
import EventType from '../models/eventType.model';

class NotificationService {
  public getNotificationsForUser = catchAsyncNext(async (req: CustomRequest, next: NextFunction, userId: number) => {
    const features = new APIFeatures(Notification, req.query as unknown as Record<string, string>, {
      where: { userId },
      order: [['sendDate', 'DESC']],
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await Notification.count({
      where: features.query.where,
    });

    const notifications = await features.execute();
    if (!notifications) return next(new AppError(errorMessage('error.emptyNotifications'), 404));

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = notifications.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: notifications,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public getAllAdminNotifications = catchAsyncNext(async (req: CustomRequest, next: NextFunction) => {
    const features = new APIFeatures(NotificationAdmin, req.query as unknown as Record<string, string>, {
      order: [['sendDate', 'DESC']],
      include: [
        {
          model: EventType,
          as: 'eventTypes',
          through: { attributes: [] },
        },
        {
          model: Province,
          as: 'provinces',
          through: { attributes: [] },
        },
      ],
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await NotificationAdmin.count({
      where: features.query.where,
    });

    const notifications = await features.execute();
    if (!notifications) return next(new AppError(errorMessage('error.emptyNotifications'), 404));

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = notifications.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: notifications,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public markNotificationAsRead = catchAsyncNext(
    async (request: CustomRequest, next: NextFunction, { notificationId, userId }): Promise<boolean> => {
      const result = await Notification.update(
        { markAsReaded: true },
        {
          where: {
            id: notificationId,
            userId,
            markAsReaded: false,
          },
        },
      );
      return result[0] > 0;
    },
  );

  public saveNotificationAdmin = catchAsyncNext(
    async (request: CustomRequest, next: NextFunction, data: CreateNotificationAdminDTO) => {
      const { eventTypeIds, provinceIds, ...notificationData } = data;
      const isAllowed = validateFieldsNames(this.notificationAdminCreate, Object.keys(data));
      if (isAllowed !== true) {
        return next(
          new AppError(
            `${isAllowed.length === 1 ? 'this field is' : 'these fields are'} not allowed:
          ${isAllowed.join(', ')}`,
            400,
          ),
        );
      }

      const notification = await NotificationAdmin.create(notificationData);

      if (eventTypeIds?.length) await notification.setEventTypes(eventTypeIds);
      if (provinceIds?.length) await notification.setProvinces(provinceIds);

      return notification;
    },
  );

  public getLastAdminNotificationsForMainPage = async () => {
    const sentNotification = await Notification.findAll({
      order: [['sendDate', 'DESC']],
      limit: 3,
    });

    return sentNotification;
  };

  private notificationAdminCreate = [
    'title',
    'body',
    'sendDate',
    'targetedUsersType',
    'gender',
    'minAge',
    'maxAge',
    'eventTypeIds',
    'provinceIds',
  ];
}

export default new NotificationService();
