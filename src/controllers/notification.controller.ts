import { Response, NextFunction } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import NotificationService from '../services/notification.service';
import catchAsync from '../utils/catchAsync';
import { defaultSuccessResponse, DefaultSuccessResponse } from '../common/messages/en/default.response';

class NotificationController {
  public getMyNotifications = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = req.normalUserFromReq?.userId || req.supervisorFromReq?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const notifications = await NotificationService.getNotificationsForUser(req, next, userId);
    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { notifications },
    };
    res.status(200).json(successResponse);
  });

  public getAdminNotifications = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const notifications = await NotificationService.getAllAdminNotifications(req, next);
    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { notifications },
    };
    res.status(200).json(successResponse);
  });

  public markAsRead = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = req.normalUserFromReq?.userId || req.supervisorFromReq?.userId;
    const notificationId = parseInt(req.params.notificationId, 10);
    if (!userId || isNaN(notificationId)) return res.status(400).json({ message: 'Invalid input' });

    const updated = await NotificationService.markNotificationAsRead(req, next, { notificationId, userId });
    if (!updated) return res.status(404).json({ message: 'Notification not found or already read' });

    return res.json({ message: 'Marked as read' });
  });
}

export default new NotificationController();
