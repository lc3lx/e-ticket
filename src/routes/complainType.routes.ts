import express, { Router } from 'express';
import ComplainTypeController from '../controllers/complainType.Controller';
import protect from '../middlewares/protectRoutes.middlware';
import authAdminOnly from '../middlewares/adminOnly.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import dashboardController from '../controllers/dashboard.controller';
// import AdminTypes from '../common/enums/adminTypes.enum';

const ComplainTypeRouter: Router = express.Router();

ComplainTypeRouter.use(protect);

ComplainTypeRouter.post(
  '/addComplainType',
  authAdminOnly,
  requirePrivilege(),
  dashboardController.dashboardLoggerMiddleware('ADD_COMPLAIN_TYPE'),
  ComplainTypeController.createComplainType,
);
ComplainTypeRouter.patch(
  '/updateComplainType',
  authAdminOnly,
  requirePrivilege(),
  dashboardController.dashboardLoggerMiddleware('UPDATE_COMPLAIN_TYPE'),
  ComplainTypeController.updateComplainType,
);
ComplainTypeRouter.delete(
  '/deleteComplainType',
  authAdminOnly,
  requirePrivilege(),
  dashboardController.dashboardLoggerMiddleware('DELETE_COMPLAIN_TYPE'),
  ComplainTypeController.deleteComplainType,
);
ComplainTypeRouter.route('/').get(
  dashboardController.dashboardLoggerMiddleware('GET_ALL_COMPLAIN_TYPE'),
  ComplainTypeController.getAllComplainTypes,
);

export default ComplainTypeRouter;
