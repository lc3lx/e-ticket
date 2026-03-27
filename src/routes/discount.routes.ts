import express, { Router } from 'express';
import discountController from '../controllers/discount.controller';
import protect from '../middlewares/protectRoutes.middlware';
import adminOnly from '../middlewares/adminOnly.middleware';
import userOnly from '../middlewares/authUserOnly.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import AdminTypes from '../common/enums/adminTypes.enum';
import dashboardController from '../controllers/dashboard.controller';

const DiscountRouter: Router = express.Router();

DiscountRouter.use(protect);

DiscountRouter.route('/')
  .get(
    requirePrivilege(AdminTypes.CFO),
    dashboardController.dashboardLoggerMiddleware('GET_ALL_DISCOUNT_CODES'),
    discountController.getAllDiscountCodes,
  )
  .post(
    adminOnly,
    requirePrivilege(),
    dashboardController.dashboardLoggerMiddleware('CREATE_DISCOUNT_CODE'),
    discountController.createDiscountCode,
  );

DiscountRouter.route('/:id')
  .get(
    requirePrivilege(AdminTypes.CFO),
    dashboardController.dashboardLoggerMiddleware('GET_ONE_DISCOUNT_CODE'),
    discountController.getDiscountCodeById,
  )
  .patch(
    adminOnly,
    requirePrivilege(),
    dashboardController.dashboardLoggerMiddleware('UPDATE_DISCOUNT_CODE'),
    discountController.updateDiscountCode,
  )
  .delete(
    adminOnly,
    requirePrivilege(),
    dashboardController.dashboardLoggerMiddleware('DELETE_DISCOUNT_CODE'),
    discountController.deleteDiscountCode,
  );

DiscountRouter.get('/:discountCode/event/:eventId', userOnly, discountController.getDiscountInfo);

export default DiscountRouter;
