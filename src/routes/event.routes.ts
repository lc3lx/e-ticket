import express, { Router } from 'express';
import EventController from '../controllers/event.controller';
import protect from '../middlewares/protectRoutes.middlware';
import authAdminOnly from '../middlewares/adminOnly.middleware';
import supervisorOnly from '../middlewares/supervisorAuthOnly.middleware';
import adminOrSupervisorAuth from '../middlewares/adminOrSupervisorAuth.middleware';
import rateEventRouter from './rateEvent.routes';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import AdminTypes from '../common/enums/adminTypes.enum';
import dashboardController from '../controllers/dashboard.controller';

const EventRouter: Router = express.Router();

EventRouter.use(protect);

EventRouter.use('/rate', rateEventRouter);

EventRouter.get(
  '/getAll',
  authAdminOnly,
  requirePrivilege(AdminTypes.CS, AdminTypes.CFO),
  dashboardController.dashboardLoggerMiddleware('GET_ALL_EVENTS'),
  EventController.getAllEventsForAdmin,
);
EventRouter.get('/getAllSupervisorEvent', supervisorOnly, EventController.getAllEventsForSupervisor);
EventRouter.get(
  '/getAllPending',
  authAdminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('GET_ALL_PENDING_APROVE_EVENTS_UPDATE'),
  EventController.getAllPendingUpdateEventsForAdmin,
);
EventRouter.get(
  '/getAllPendingApprove',
  authAdminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('GET_ALL_PENDING_APROVE_EVENTS'),
  EventController.getAllPendingApproveEventsForAdmin,
);
EventRouter.get(
  '/getOne/:id',
  authAdminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('GET_ONE_EVENT'),
  EventController.getOneEventForAdmin,
);
EventRouter.get(
  '/getOnePending/:id',
  authAdminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('GET_ONE_PENDING_APROVE_EVENT_UPDATE'),
  EventController.getOnePendingUpdateEventForAdmin,
);
EventRouter.get(
  '/hideAndUnhideEvent/:eventId',
  authAdminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('HIDE/UNHIDE EVENT'),
  EventController.hideEvent,
);
EventRouter.delete(
  '/deleteEvent/:eventId',
  requirePrivilege(),
  adminOrSupervisorAuth,
  dashboardController.dashboardLoggerMiddleware('DELETE_EVENT'),
  EventController.deleteEvent,
);
EventRouter.post(
  '/create',
  authAdminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('CREATE_EVENT'),
  EventController.uploadImagesForEvent,
  EventController.processEventPhotos,
  EventController.createNewEvent,
);
EventRouter.patch(
  '/update/:id',
  authAdminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('UPDATE_EVENT'),
  EventController.uploadImagesForEvent,
  EventController.processEventPhotos,
  EventController.updateEventForAdmin,
);

EventRouter.route('/')
  .get(EventController.getAllEvents)
  .post(
    supervisorOnly,
    EventController.uploadImagesForEvent,
    EventController.processEventPhotos,
    EventController.createNewEvent,
  );
EventRouter.patch(
  '/:id/approve',
  authAdminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('APPROVE_EVENT'),
  EventController.approveEventByAdmin,
);
EventRouter.patch(
  '/:id/decline',
  authAdminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('DECLINE_EVENT'),
  EventController.declineEventByAdmin,
);
EventRouter.patch(
  '/:id/suspendToggle',
  authAdminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('SUSPEND_EVENT'),
  EventController.suspendEventByAdmin,
);
EventRouter.patch(
  '/:id/updateApprove',
  authAdminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('APPROVE_EVENT_UPDATE'),
  EventController.approveUpdateEvent,
);
EventRouter.patch(
  '/:id/updateDecline',
  authAdminOnly,
  requirePrivilege(AdminTypes.CS),
  dashboardController.dashboardLoggerMiddleware('DECLINE_EVENT_UPDATE'),
  EventController.declineUpdateEvent,
);

EventRouter.get('/getTop10Events', EventController.getTop10Events);
EventRouter.get('/suggestedEvents', EventController.suggestedEvents);
EventRouter.get('/getRateAppNotification', supervisorOnly, EventController.getRateAppNotification);

EventRouter.route('/:id')
  .get(EventController.getOneEvent)
  .patch(
    supervisorOnly,
    EventController.uploadImagesForEvent,
    EventController.processEventPhotos,
    EventController.updateEvent,
  );

export default EventRouter;
