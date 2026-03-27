import express, { Router } from 'express';
import ComlainController from '../controllers/complain.controller';
import protect from '../middlewares/protectRoutes.middlware';
import authUserOnly from '../middlewares/authUserOnly.middleware';
import adminOnly from '../middlewares/adminOnly.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import AdminTypes from '../common/enums/adminTypes.enum';
import dashboardController from '../controllers/dashboard.controller';

const ComplainRouter: Router = express.Router();

ComplainRouter.use(protect);

ComplainRouter.route('/').get(
  adminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('GET_ALL_COMPLAINS'),
  ComlainController.getAllComplains,
);
ComplainRouter.route('/read/:complainId').get(
  adminOnly,
  requirePrivilege(),
  dashboardController.dashboardLoggerMiddleware('READ_COMPLAIN'),
  ComlainController.readComplaint,
);
ComplainRouter.route('/user/:userId').get(
  adminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('GET_ALL_COMPLAINS_BY_USER'),
  ComlainController.getAllComplainsByUser,
);
ComplainRouter.route('/event/:eventId').get(
  adminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('GET_ALL_COMPLAINS_BY_EVENT'),
  ComlainController.getAllComplainsByEvent,
);

ComplainRouter.use(authUserOnly);

ComplainRouter.post('/', ComlainController.CreateComplain);

export default ComplainRouter;
