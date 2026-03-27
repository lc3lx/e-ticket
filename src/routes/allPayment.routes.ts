import express, { Router } from 'express';
import allPaymentController from '../controllers/allPayment.controller';
import protect from '../middlewares/protectRoutes.middlware';
import authAdminOnly from '../middlewares/adminOnly.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import AdminTypes from '../common/enums/adminTypes.enum';
import dashboardController from '../controllers/dashboard.controller';

const AllPaymentRouter: Router = express.Router();

AllPaymentRouter.use(protect);

AllPaymentRouter.get('/', allPaymentController.getAllPayments);
AllPaymentRouter.get('/getAll', allPaymentController.getAllPaymentsWithoutPaggination);
AllPaymentRouter.use(authAdminOnly);

AllPaymentRouter.route('/payment/:paymentId')
  .get(requirePrivilege(AdminTypes.CFO), allPaymentController.getOnePayment)
  .patch(
    requirePrivilege(AdminTypes.CFO),
    dashboardController.dashboardLoggerMiddleware('UPDATE_PAYMENT_METHOD'),
    allPaymentController.uploadPaymentMethodLogo,
    allPaymentController.savePaymentMethodLogo,
    allPaymentController.updatePayment,
  )
  .delete(
    requirePrivilege(),
    dashboardController.dashboardLoggerMiddleware('DELETE_PAYMENT_METHOD'),
    allPaymentController.deletePayment,
  );

export default AllPaymentRouter;
