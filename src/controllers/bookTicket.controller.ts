import { Response, NextFunction } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response.js';
import CreateBookingDto from '../interfaces/bookTicket/booking.dto.js';
import { errorMessage } from '../modules/i18next.config';
import BookingServiceClass from '../services/bookTicket.service';
import { BookingService } from '../services/bookTicket.service';
import { getLanguage } from '../utils/getLanguage';

class BookTicketController {
  private bookingService: BookingService;

  constructor(bookingService: BookingService) {
    this.bookingService = bookingService;
  }

  public createBooking = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId: number = req.normalUserFromReq?.id || req.body.userId;
    const data: CreateBookingDto = req.body;
    if (!data.eventId || !data.ticketsCount)
      return next(new AppError(errorMessage('error.MissingRequiredFields'), 400));

    const booking = await this.bookingService.createBooking(req, next, { ...data, userId });
    if (!booking) return next(new AppError(errorMessage('error.BookingCreationFailed'), 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { ...booking },
    };
    res.status(201).json(successResponse);
  });

  public getAllBooking = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const allBookings = await this.bookingService.getAllBooking(req, next);

    if (!allBookings) return next(new AppError(errorMessage('error.emptyBooking'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { allBookings },
    };
    res.status(200).json(successResponse);
  });

  public getAllBookingForSupervisorByEvent = catchAsync(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
      const eventId = req.params.eventId;
      const allBookings = await this.bookingService.getAllBookingForSupervisorByEvent(req, next, eventId);

      if (!allBookings) return next(new AppError(errorMessage('error.emptyBooking'), 404));

      const successResponse: DefaultSuccessResponse = {
        ...defaultSuccessResponse(),
        data: { allBookings },
      };
      res.status(200).json(successResponse);
    },
  );

  public getAllBookingForUser = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = req.normalUserFromReq!.id;
    const allBookings = await this.bookingService.getAllBookingForUser(req, next, userId);

    if (!allBookings) return next(new AppError(errorMessage('error.emptyBooking'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { allBookings },
    };
    res.status(200).json(successResponse);
  });

  public cancelBookingFromAdmin = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const bookingId = parseInt(req.params.bookingId, 10);
    const isConfirmed = req.body.isConfirmed === true;
    const language = getLanguage(req);
    const result = await this.bookingService.cancelBookingFromAdmin({ bookingId, isConfirmed, language }, next);
    if (result) {
      res.status(200).json(result);
    }
  });

  public cancelBookingUser = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const bookingId = parseInt(req.params.bookingId, 10);
    const userId = req.normalUserFromReq!.id;
    const result = await this.bookingService.cancelBookingUser({ bookingId, userId }, next);
    if (result) {
      res.status(200).json(result);
    }
  });

  public cancelBookingSupervisor = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const bookingId = parseInt(req.params.bookingId, 10);
    const supervisorId = req.supervisorFromReq!.id;
    const result = await this.bookingService.cancelBookingSupervisor({ bookingId, supervisorId }, next);
    if (result) {
      res.status(200).json(result);
    }
  });

  public approveBooking = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { bookingId } = req.params;
    const supervisorId = req.supervisorFromReq?.id || req.body.supervisorId;
    if (!bookingId) return next(new AppError(errorMessage('error.MissingBookingId'), 400));

    const data = { bookingId, supervisorId };

    const booking = await this.bookingService.approveBooking(data, next);
    if (!booking) return next(new AppError(errorMessage('error.BookingNotFound'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { booking },
    };
    res.status(200).json(successResponse);
  });

  public initPayment = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { bookingId } = req.params;
    const { mobileNumber, ServiceName } = req.body;
    if (!bookingId) return next(new AppError(errorMessage('error.MissingBookingId'), 400));
    if (!mobileNumber) return next(new AppError(errorMessage('error.missing mobile number'), 400));
    if (!ServiceName) return next(new AppError(errorMessage('error.missing service name'), 400));

    const language = getLanguage(req);
    const data: { bookId: number; mobileNumber: string; ServiceName: string; language: 'ar' | 'en' } = {
      bookId: Number(bookingId),
      mobileNumber,
      ServiceName,
      language,
    };

    const booking = await this.bookingService.initPayment(data, next);
    if (!booking) return next(new AppError(errorMessage('error.PaymentProcessingFailed'), 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { ...booking },
    };
    res.status(200).json(successResponse);
  });

  public processPayment = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { bookingId } = req.params;
    const userId = req.normalUserFromReq?.id;
    const { code, ServiceName } = req.body;
    if (!bookingId) return next(new AppError(errorMessage('error.MissingBookingId'), 400));
    if (!userId) return next(new AppError(errorMessage('error.Missing user id'), 400));

    const language = getLanguage(req);
    const data: { bookingId: number; userId: number; code: string; ServiceName: string; language: 'ar' | 'en' } = {
      bookingId: Number(bookingId),
      userId,
      code,
      ServiceName,
      language,
    };

    const booking = await this.bookingService.processPayment(data, next);
    if (!booking) return next(new AppError(errorMessage('error.PaymentProcessingFailed'), 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { booking },
    };
    res.status(200).json(successResponse);
  });

  public initPaymentResend = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { bookingId } = req.params;
    const { mobileNumber, ServiceName } = req.body;
    if (!bookingId) return next(new AppError(errorMessage('error.MissingBookingId'), 400));
    if (!mobileNumber) return next(new AppError(errorMessage('error.missing mobile number'), 400));
    if (!ServiceName) return next(new AppError(errorMessage('error.missing service name'), 400));

    const language = getLanguage(req);
    const data: { bookId: number; mobileNumber: string; ServiceName: string; language: 'ar' | 'en' } = {
      bookId: Number(bookingId),
      mobileNumber,
      ServiceName,
      language,
    };

    const booking = await this.bookingService.resendPaymentCode(data, next);
    if (!booking) return next(new AppError(errorMessage('error.PaymentProcessingFailed'), 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { booking },
    };
    res.status(200).json(successResponse);
  });

  public getPaymentNotification = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = Number(req.normalUserFromReq?.id);
    const isAccepted = req.normalUserFromReq?.acceptRateAppNotification!;
    if (!userId) return next(new AppError(errorMessage('error.Missing user id'), 400));

    const notificationStatus = await this.bookingService.getPaymentNotification({ userId, isAccepted }, next);
    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { notificationStatus, isAccepted },
    };
    res.status(200).json(successResponse);
  });

  public getEPaymentStatus = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = Number(req.normalUserFromReq?.id);
    const bookId = Number(req.params.bookingId);
    const ServiceName = req.body.ServiceName;
    if (!userId) return next(new AppError(errorMessage('error.Missing user id'), 400));
    if (!bookId) return next(new AppError(errorMessage('error.Missing book id'), 400));

    const ePaymentStatus = await this.bookingService.getPaymentStatus({ userId, bookId, ServiceName }, next);
    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { ePaymentStatus },
    };
    res.status(200).json(successResponse);
  });
}

export default new BookTicketController(BookingServiceClass);
