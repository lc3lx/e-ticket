import express, { Router } from 'express';
import MTNEPaymentController from '../controllers/MTNEPayment.controller';
import protect from '../middlewares/protectRoutes.middlware';
import adminOnly from '../middlewares/adminOnly.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import dashboardController from '../controllers/dashboard.controller';
// import AdminTypes from '../common/enums/adminTypes.enum';

const MTNEPaymentRouter: Router = express.Router();

MTNEPaymentRouter.use(protect);
MTNEPaymentRouter.use(adminOnly);
MTNEPaymentRouter.use(requirePrivilege());

MTNEPaymentRouter.get(
  '/',
  dashboardController.dashboardLoggerMiddleware('GET_MTN_DATA'),
  MTNEPaymentController.getAllMTNEPayment,
);

export default MTNEPaymentRouter;
