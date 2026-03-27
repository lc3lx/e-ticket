import express, { Router } from 'express';
import messageController from '../controllers/message.controller';
import protect from '../middlewares/protectRoutes.middlware';
import adminOrSupervisor from '../middlewares/adminOrSupervisorAuth.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import dashboardController from '../controllers/dashboard.controller';
// import AdminTypes from '../common/enums/adminTypes.enum';

const MessageRouter: Router = express.Router();

MessageRouter.use(protect);

MessageRouter.post(
  '/',
  adminOrSupervisor,
  requirePrivilege(),
  dashboardController.dashboardLoggerMiddleware('ADD_RESPONSE_TO_REQUEST'),
  messageController.addRequestMessage,
);
MessageRouter.get(
  '/request/:requestId',
  adminOrSupervisor,
  requirePrivilege(),
  messageController.getAllMessagesByRequestId,
);
export default MessageRouter;
