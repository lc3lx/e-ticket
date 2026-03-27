import express, { Router } from 'express';
import NotificationController from '../controllers/notification.controller';
import protect from '../middlewares/protectRoutes.middlware';
import adminOnly from '../middlewares/adminOnly.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import AdminTypes from '../common/enums/adminTypes.enum';
import dashboardController from '../controllers/dashboard.controller';

const NotificationRouter: Router = express.Router();

NotificationRouter.use(protect);

NotificationRouter.route('/').get(NotificationController.getMyNotifications);
NotificationRouter.route('/getAll').get(
  adminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('GET_ALL_ADMIN_NOTIFICATIONS'),
  NotificationController.getAdminNotifications,
);
NotificationRouter.route('/:notificationId').get(NotificationController.markAsRead);

export default NotificationRouter;
