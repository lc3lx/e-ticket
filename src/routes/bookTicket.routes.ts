// routes/booking.routes.ts
import express, { Router } from 'express';
import BookingController from '../controllers/bookTicket.controller.js';
import protect from '../middlewares/protectRoutes.middlware';
import authUserOnly from '../middlewares/authUserOnly.middleware.js';
import supervisorOnly from '../middlewares/supervisorAuthOnly.middleware';
import adminOnly from '../middlewares/adminOnly.middleware.js';
import EPaymentStatus from '../middlewares/EPaymentGateway.middleware.js';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import AdminTypes from '../common/enums/adminTypes.enum';
import dashboardController from '../controllers/dashboard.controller.js';

const BookingRouter: Router = express.Router();

BookingRouter.use(protect);

BookingRouter.route('/:bookingId/approve').put(supervisorOnly, BookingController.approveBooking);

BookingRouter.get(
  '/getAll',
  adminOnly,
  requirePrivilege(),
  dashboardController.dashboardLoggerMiddleware('GET_ALL_BOOKINGS'),
  BookingController.getAllBooking,
);
BookingRouter.get('/supervisor/:eventId/getAll', supervisorOnly, BookingController.getAllBookingForSupervisorByEvent);

BookingRouter.post(
  '/:bookingId/cancel-admin',
  adminOnly,
  requirePrivilege(),
  dashboardController.dashboardLoggerMiddleware('CANCEL_BOOKING'),
  BookingController.cancelBookingFromAdmin,
);
BookingRouter.get('/:bookingId/cancel-supervisor', supervisorOnly, BookingController.cancelBookingSupervisor);

BookingRouter.use(authUserOnly);

BookingRouter.route('/user').get(BookingController.getAllBookingForUser);
BookingRouter.route('/getRateAppNotification').get(BookingController.getPaymentNotification);
BookingRouter.route('/').post(BookingController.createBooking);
BookingRouter.route('/:bookingId/EPayment/getEPaymentStatus').post(EPaymentStatus, BookingController.getEPaymentStatus);
BookingRouter.route('/:bookingId/initPayment').post(EPaymentStatus, BookingController.initPayment);
// BookingRouter.route('/:bookingId/Payment/resendCode').post(EPaymentStatus, BookingController.initPaymentResend);
BookingRouter.route('/:bookingId/payment').post(BookingController.processPayment);
BookingRouter.get('/:bookingId/cancel-user', BookingController.cancelBookingUser);

export default BookingRouter;
