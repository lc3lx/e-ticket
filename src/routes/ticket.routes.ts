import express from 'express';
import TicketController from '../controllers/ticket.controller.js';
import protect from '../middlewares/protectRoutes.middlware';
import supervisorOnly from '../middlewares/supervisorAuthOnly.middleware';
import adminOnly from '../middlewares/adminOnly.middleware.js';
import authUserOnly from '../middlewares/authUserOnly.middleware.js';
import scannerOrSupervisor from '../middlewares/supervisorOrScanner.middleware.js';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import dashboardController from '../controllers/dashboard.controller.js';
// import AdminTypes from '../common/enums/adminTypes.enum';

const ticketRouter = express.Router();

ticketRouter.use(protect);

ticketRouter.get('/scan/:ticketId/event/:eventId', scannerOrSupervisor, TicketController.scanerTicket);
ticketRouter.get('/user/', authUserOnly, TicketController.getAllTicketsForUser);
ticketRouter.get('/book/:bookingId/', supervisorOnly, TicketController.getTicketsByBooking);
ticketRouter.get('/getAll', adminOnly, requirePrivilege(), TicketController.getAllBooking);
ticketRouter.get(
  '/:ticketId/suspend',
  adminOnly,
  requirePrivilege(),
  dashboardController.dashboardLoggerMiddleware('SUSPEND_TICKET'),
  TicketController.suspendTicketsByBooking,
);

export default ticketRouter;
