import express, { Router } from 'express';
import supervisorRequestController from '../controllers/supervisorRequest.controller';
import protect from '../middlewares/protectRoutes.middlware';
import adminOnly from '../middlewares/adminOnly.middleware';
import supervisorOnly from '../middlewares/supervisorAuthOnly.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import AdminTypes from '../common/enums/adminTypes.enum';

const RequestRouter: Router = express.Router();

RequestRouter.use(protect);

RequestRouter.route('/supervisorRequest/:type').get(
  supervisorOnly,
  supervisorRequestController.getAllRequestsForSupervisor,
);
RequestRouter.route('/:type').get(
  adminOnly,
  requirePrivilege(AdminTypes.CS),
  supervisorRequestController.getAllRequestsForAdmin,
);

export default RequestRouter;
