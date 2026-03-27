import express, { Router } from 'express';
import termsAndConditionsController from '../controllers/termsAndConditions.controller';
import protect from '../middlewares/protectRoutes.middlware';
import authAdminOnly from '../middlewares/adminOnly.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import dashboardController from '../controllers/dashboard.controller';
// import AdminTypes from '../common/enums/adminTypes.enum';

const TermsAndConditionRouter: Router = express.Router();

TermsAndConditionRouter.route('/')
  .get(termsAndConditionsController.getTermsAndConditions)
  .post(
    protect,
    authAdminOnly,
    requirePrivilege(),
    dashboardController.dashboardLoggerMiddleware('UPDATE_TERMS_AND_CONDITIONS'),
    termsAndConditionsController.createOrUpdateTermsAndConditions,
  );

export default TermsAndConditionRouter;
