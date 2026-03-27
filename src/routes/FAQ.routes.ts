import express, { Router } from 'express';
import FAQController from '../controllers/FAQ.controller';
import protect from '../middlewares/protectRoutes.middlware';
import authAdminOnly from '../middlewares/adminOnly.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import AdminTypes from '../common/enums/adminTypes.enum';
import dashboardController from '../controllers/dashboard.controller';

const FAQRouter: Router = express.Router();

FAQRouter.use(protect);

FAQRouter.route('/')
  .get(FAQController.getAllFAQ)
  .post(
    authAdminOnly,
    requirePrivilege(AdminTypes.CS),
    dashboardController.dashboardLoggerMiddleware('CREATE_fAQ'),
    FAQController.createFAQ,
  );
FAQRouter.get('/up/:FAQId', authAdminOnly, requirePrivilege(AdminTypes.CS), FAQController.moveUpFAQ);
FAQRouter.get('/down/:FAQId', authAdminOnly, requirePrivilege(AdminTypes.CS), FAQController.moveDownFAQ);
FAQRouter.route('/:FAQId')
  .get(FAQController.getOneFAQ)
  .patch(
    authAdminOnly,
    requirePrivilege(AdminTypes.CS),
    dashboardController.dashboardLoggerMiddleware('UPDATE_FAQ'),
    FAQController.updateFAQ,
  )
  .delete(
    authAdminOnly,
    requirePrivilege(AdminTypes.CS),
    dashboardController.dashboardLoggerMiddleware('DELETE_FAQ'),
    FAQController.deleteFAQ,
  );

export default FAQRouter;
