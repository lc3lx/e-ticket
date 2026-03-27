import { Router } from 'express';
import {
  registerPushToken,
  sendNotificationsForUsers,
  sendNotificationsForSupervisors,
} from '../controllers/push.controller';
import protect from '../middlewares/protectRoutes.middlware';
import adminOnly from '../middlewares/adminOnly.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import dashboardController from '../controllers/dashboard.controller';
// import AdminTypes from '../common/enums/adminTypes.enum';

const pushRouter = Router();

pushRouter.use(protect);

pushRouter.post('/register', registerPushToken);

pushRouter.use(adminOnly);
pushRouter.use(requirePrivilege());

pushRouter.post(
  '/sendToUsers',
  dashboardController.dashboardLoggerMiddleware('SEND_NOTIFICATIONS_TO_USERS'),
  sendNotificationsForUsers,
);
pushRouter.post(
  '/sendToSupervisors',
  dashboardController.dashboardLoggerMiddleware('SEND_NOTIFICATIONS_TO_SUPERVISORS'),
  sendNotificationsForSupervisors,
);

export default pushRouter;
