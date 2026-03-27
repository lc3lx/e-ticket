import express, { Router } from 'express';
import NormalUserController from '../controllers/normalUser.controller';
import protect from '../middlewares/protectRoutes.middlware';
import authUserOnly from '../middlewares/authUserOnly.middleware';
import adminOnly from '../middlewares/adminOnly.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import AdminTypes from '../common/enums/adminTypes.enum';
import dashboardController from '../controllers/dashboard.controller';

const NormalUserRouter: Router = express.Router();

NormalUserRouter.use(protect);

NormalUserRouter.get(
  '/',
  adminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('GET_ALL_NORMAL_USERS'),
  NormalUserController.getAllUsers,
);

NormalUserRouter.get(
  '/blockAccount/:normalUserId',
  adminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('BLOCK/UNBLOCK_USER'),
  NormalUserController.blockANdNonBlockNormalUSerAccount,
);

NormalUserRouter.use(authUserOnly);
NormalUserRouter.patch(
  '/',
  NormalUserController.uploadSingleImageForProfile,
  NormalUserController.resizeUserPhotoService,
  NormalUserController.updateNormalUserInfo,
);

NormalUserRouter.get('/me', NormalUserController.getNormalUserProfile);
NormalUserRouter.get('/acceptRateAppNotification', NormalUserController.acceptRateAppNotification);
NormalUserRouter.get('/events/me', NormalUserController.getAllUsersBookedEvents);
export default NormalUserRouter;
