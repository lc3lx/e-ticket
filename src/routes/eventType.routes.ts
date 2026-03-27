import express, { Router } from 'express';
import eventTypeController from '../controllers/eventType.controller';
import protect from '../middlewares/protectRoutes.middlware';
import authAdminOnly from '../middlewares/adminOnly.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import AdminTypes from '../common/enums/adminTypes.enum';
import dashboardController from '../controllers/dashboard.controller';

const EventTypeRouter: Router = express.Router();

EventTypeRouter.get('/', eventTypeController.getAllEventTypes);

EventTypeRouter.use(protect);
EventTypeRouter.use(authAdminOnly);
EventTypeRouter.use(requirePrivilege(AdminTypes.CS));

EventTypeRouter.post(
  '/addEventType',
  dashboardController.dashboardLoggerMiddleware('ADD_EVENT_TYPE'),
  eventTypeController.createEventType,
);
EventTypeRouter.patch(
  '/updateEventType',
  dashboardController.dashboardLoggerMiddleware('UPDATE_EVENT_TYPE'),
  eventTypeController.updateEventType,
);
EventTypeRouter.delete(
  '/deleteEventType',
  dashboardController.dashboardLoggerMiddleware('DELETE_EVENT_tYPE'),
  eventTypeController.deleteEventType,
);

export default EventTypeRouter;
