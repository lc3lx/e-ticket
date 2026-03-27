import express, { Router } from 'express';
import privacyPolicyController from '../controllers/privacyPolicy.controller';
import protect from '../middlewares/protectRoutes.middlware';
import authAdminOnly from '../middlewares/adminOnly.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import dashboardController from '../controllers/dashboard.controller';
// import AdminTypes from '../common/enums/adminTypes.enum';

const PrivacyPolicyRouter: Router = express.Router();

PrivacyPolicyRouter.route('/')
  .get(privacyPolicyController.getPrivacyPolicy)
  .post(
    protect,
    authAdminOnly,
    requirePrivilege(),
    dashboardController.dashboardLoggerMiddleware('UPDATE_PRICACY_POLICY'),
    privacyPolicyController.createOrUpdatePrivacyPolicy,
  );

export default PrivacyPolicyRouter;
