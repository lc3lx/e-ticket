import express, { Router } from 'express';
import supervisorController from '../controllers/supervisor.controller';
import protect from '../middlewares/protectRoutes.middlware';
import supervisorOnly from '../middlewares/supervisorAuthOnly.middleware';
import adminOnly from '../middlewares/adminOnly.middleware';
import adminOrSupervisorAuth from '../middlewares/adminOrSupervisorAuth.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import AdminTypes from '../common/enums/adminTypes.enum';
import dashboardController from '../controllers/dashboard.controller';

const SupervisorRouter: Router = express.Router();

SupervisorRouter.post('/login', supervisorController.login);
SupervisorRouter.post(
  '/signup',
  supervisorController.uploadWorkDocument,
  supervisorController.saveWorkDocument,
  supervisorController.register,
);
SupervisorRouter.post('/getAccessToken', supervisorController.getGeneratedAccessToken);

SupervisorRouter.patch('/forgetPassword', supervisorController.forgetSupervisorPassword);

SupervisorRouter.use(protect);

SupervisorRouter.get('/getAll', adminOnly, requirePrivilege(AdminTypes.CS), supervisorController.getAllSupervisors);
SupervisorRouter.get(
  '/getOne/:supervisorId',
  adminOnly,
  requirePrivilege(AdminTypes.CS),
  supervisorController.getOneSupervisor,
);
SupervisorRouter.get(
  '/allRequests',
  adminOnly,
  requirePrivilege(AdminTypes.CS),
  supervisorController.getAllUpdateSupervisorProfileRequests,
);
SupervisorRouter.patch(
  '/approveUpdateRequest',
  adminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('APPROVE_UPDATE_REQUEST_FOR_SUPERVISOR'),
  supervisorController.approveUpdateProfileRequest,
);
SupervisorRouter.patch(
  '/rejectUpdateRequest',
  adminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('REJECT_UPDATE_REQUEST_FOR_SUPERVISOR'),
  supervisorController.rejectUpdateProfileRequest,
);
SupervisorRouter.get(
  '/activateAccount/:supervisorId',
  adminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('ACTIVATE_SUPERVISOR_ACCOUNT'),
  supervisorController.activateSupervisorAccount,
);
SupervisorRouter.get(
  '/blockAccount/:supervisorId',
  adminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('BLOCK/UNBLOCK_SUPERVISOR_ACCOUNT'),
  supervisorController.blockSupervisorAccount,
);
SupervisorRouter.delete(
  '/AcceptDeleteAccount/:supervisorId',
  adminOnly,
  requirePrivilege(),
  dashboardController.dashboardLoggerMiddleware('ACCEPT_DELETE_SUPERVISOR_ACCOUNT'),
  supervisorController.acceptDeleteAccountRequest,
);
SupervisorRouter.route('/deleteAccount/:supervisorId?')
  .get(supervisorOnly, supervisorController.deleteSupervisorAccount)
  .delete(
    adminOnly,
    requirePrivilege(),
    dashboardController.dashboardLoggerMiddleware('DELETE_SUPERVISOR_ACCOUNT'),
    supervisorController.deleteSupervisorAccount,
  );
SupervisorRouter.get(
  '/deactivateAccount/:supervisorId?',
  adminOrSupervisorAuth,
  requirePrivilege(AdminTypes.CS),
  supervisorController.deactivateSupervisorAccount,
);
SupervisorRouter.patch(
  '/updateInfo/:supervisorId',
  adminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('UPDATE_SUPERVISOR_ACCOUNT'),

  supervisorController.uploadWorkDocument,
  supervisorController.saveWorkDocument,
  supervisorController.updateSupervisorFromAdmin,
);

SupervisorRouter.use(supervisorOnly);

SupervisorRouter.get('/acceptRateAppNotification', supervisorController.acceptRateAppNotification);
SupervisorRouter.get('/getMe', supervisorOnly, supervisorController.getSupervisorProfile);
SupervisorRouter.patch('/changePassword', supervisorOnly, supervisorController.updateSupervisorPassword);
SupervisorRouter.post(
  '/updateMe',
  supervisorOnly,
  supervisorController.uploadWorkDocument,
  supervisorController.saveWorkDocument,
  supervisorController.submitSupervisorUpdateProfileRequest,
);

export default SupervisorRouter;
