import express, { Router } from 'express';
import aboutUsController from '../controllers/aboutUs.controller';
import protect from '../middlewares/protectRoutes.middlware';
import authAdminOnly from '../middlewares/adminOnly.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import dashboardController from '../controllers/dashboard.controller';
// import AdminTypes from '../common/enums/adminTypes.enum';

const AboutUsRouter: Router = express.Router();

AboutUsRouter.route('/')
  // .get(aboutUsController.getAboutUs)
  .get(dashboardController.dashboardLoggerMiddleware('GET_ABOUT_US'), aboutUsController.getAboutUs)
  .post(
    protect,
    authAdminOnly,
    requirePrivilege(),
    dashboardController.dashboardLoggerMiddleware('UPDATE_ABOUT_US'),
    aboutUsController.createOrUpdateAboutUs,
  );

export default AboutUsRouter;
