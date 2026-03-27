import cron from 'node-cron';
import { NextFunction } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto.js';
import { col, fn, literal, Op, QueryTypes, Sequelize, Transaction, WhereOptions } from 'sequelize';
import Booking from '../models/BookTicket.model.js';
import Ticket from '../models/ticket.model.js';
import Event from '../models/event.model.js';
import { Supervisor } from '../models/supervisor.model.js';
import User from '../models/user.model.js';
import NormalUser from '../models/normalUser.model.js';
import Discount from '../models/discountCode.model.js';
import CreateBookingDto from '../interfaces/bookTicket/booking.dto.js';
import catchAsyncService from '../utils/catchAsyncService.js';
import catchAsyncNext from '../utils/catchAsyncReqNext.js';
import AppError from '../utils/AppError.js';
import { commonMessage, errorMessage } from '../modules/i18next.config';
import { validateForeignKey } from '../utils/validateForeignKey.js';
import validateFieldsNames from '../utils/validateFields.js';
import EventStatus from '../common/enums/eventStatus.enum.js';
import CreateTicketDTO from '../interfaces/ticket/createTicket.dto.js';
import APIFeatures from '../utils/apiFeatures.js';
import { TicketService } from './ticket.service.js';
import BookTicketStatus from '../common/enums/bookTicketStatus.enum.js';
import BookTicketPaymentStatus from '../common/enums/bookTicketPaymentStatus.enum.js';
import AttendanceType from '../common/enums/AttendanceType.enum.js';
import Gender from '../common/enums/gender.enum.js';
import { PushNotificationService } from './push.service.js';
import NotificationTypes from '../common/enums/notificationTypes.enum';
import MTNEPaymentService from './MTNEPayment.service.js';
import { CreateMTNInvoiceDTO } from '../interfaces/ePayment/MTN/createInvoice.dto.js';
import SyriatelEPaymentService from './syriatelEPayment.service.js';
import { SyriatelInitPaymentDTO } from '../interfaces/ePayment/Syriatel/initPayment.dto.js';
import allEPaymentService from './allEPayment.service.js';
import { InitPaymentDTO } from '../interfaces/ePayment/globalPayment/initPayment.dto.js';
import { initPayment } from '../modules/zodValidation/ePayment/globalPayment/initPayment.config.js';
import PaymentVerificationService from './EPaymentVerification.service.js';
import { PaymentServiceName } from '../config/EPaymentMethodsRules.config.js';
import EPaymentVerificationService from './EPaymentVerification.service.js';
import { calculateCancelAfter, calculateCancelAfterInMinutes } from '../utils/cancelAfter.js';
import Province from '../models/provinces.model.js';
import EventType from '../models/eventType.model.js';

interface CancelWarnings {
  isPaid: boolean;
  isPendingApproval: boolean;
}

export class BookingService {
  private sequelize: Sequelize;
  private ticketService: TicketService;
  private cronScheduled: boolean = false;
  private lastImmediateRun: Date | null = null;
  private readonly Booking = Booking;
  private readonly Event = Event;
  private readonly NormalUser = NormalUser;
  private readonly Supervisor = Supervisor;
  private readonly User = User;
  private readonly paymentVerificationService = EPaymentVerificationService;

  constructor(sequelize: Sequelize, ticketService: TicketService) {
    this.sequelize = sequelize;
    this.ticketService = ticketService;
    this.paymentVerificationService = EPaymentVerificationService;
    this.initializeDbJobs().catch((error) => console.error('Failed to initialize jobs:', error.message));
  }

  private async initializeDbJobs() {
    await this.createStoredProcedure();
    await this.runImmediateCancellation();
    await this.setupScheduler();
  }

  public getAllBooking = catchAsyncNext(async (req, next: NextFunction) => {
    const includeOptions = [
      {
        model: this.Event,
        as: 'event',
        include: [{ model: this.Supervisor, as: 'supervisor', include: [{ model: this.User, as: 'user' }] }],
      },
    ];
    const features = new APIFeatures(this.Booking, req.query as unknown as Record<string, string>, {
      include: includeOptions,
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await this.Booking.count({
      where: features.query.where,
      include: includeOptions,
    });
    const allBookings = await features.execute();

    if (!allBookings) return next(new AppError(errorMessage('error.emptyBooking'), 404));

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = allBookings.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: allBookings,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public getAllBookingForSupervisorByEvent = catchAsyncNext(async (req, next: NextFunction, eventId: number) => {
    if (!(await validateForeignKey(Event, eventId, 'Event'))) return next(new AppError('Invalid eventId', 400));
    const includeOptions = [
      {
        model: this.Event,
        as: 'event',
        include: [{ model: this.Supervisor, as: 'supervisor', include: [{ model: this.User, as: 'user' }] }],
      },
      { model: this.NormalUser, as: 'user', include: [{ model: this.User, as: 'user' }] },
    ];
    const features = new APIFeatures(this.Booking, req.query as unknown as Record<string, string>, {
      include: includeOptions,
      where: { eventId, status: 'pending', paymentStatus: 'pending' },
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await this.Booking.count({
      where: features.options.where,
      include: includeOptions,
    });
    const allBookings = await features.execute();
    if (!allBookings) return next(new AppError(errorMessage('error.emptyBooking'), 404));

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = allBookings.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: allBookings,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public getAllBookingForUser = catchAsyncNext(async (req, next: NextFunction, userId: number) => {
    if (!(await validateForeignKey(NormalUser, userId, 'NormalUser')))
      return next(new AppError('Invalid eventId', 400));
    const includeOptions = [
      {
        model: this.Event,
        as: 'event',

        include: [
          {
            model: Supervisor,
            as: 'supervisor',
            include: [{ model: User, as: 'user' }],
          },
        ],
      },
    ];
    const features = new APIFeatures(this.Booking, req.query as unknown as Record<string, string>, {
      include: includeOptions,
      where: { userId },
      order: [['createdAt', 'DESC']],
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await this.Booking.count({
      where: features.options.where,
      include: includeOptions,
    });
    const allBookings = await features.execute();
    if (!allBookings) return next(new AppError(errorMessage('error.emptyBooking'), 404));

    const enrichedBookings = allBookings.map((booking) => {
      const plainBooking = booking.get({ plain: true }) as any;

      const ticketsCount = plainBooking.ticketsCount ?? 0;
      const ticketPrice = plainBooking.ticketPrice ?? 0;
      const eventProfit = plainBooking.totalProfit ?? 0;
      const eventProfitWithDiscount = plainBooking.totalProfitWithDiscount ?? 0;

      return {
        ...plainBooking,

        totalTicketPrice: ticketPrice * ticketsCount,
        totalProfit: eventProfit * ticketsCount,
        totalProfitWithDiscount: eventProfitWithDiscount || 0,
      };
    });

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = allBookings.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: enrichedBookings,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public getAllEventBookedForUser = catchAsyncNext(async (req: CustomRequest, next: NextFunction, userId: number) => {
    if (!(await validateForeignKey(NormalUser, userId, 'NormalUser'))) return next(new AppError('Invalid userId', 400));

    const includeOptions = [
      {
        model: this.Booking,
        as: 'bookings',
        where: { userId: userId },
        attributes: [],
      },
    ];

    const features = new APIFeatures(this.Event, req.query as unknown as Record<string, string>, {
      include: includeOptions,
      group: ['Event.id'],
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await Event.count({
      include: [
        {
          model: Booking,
          as: 'bookings',
          where: { userId: userId },
          attributes: [],
        },
      ],
      distinct: true,
      col: 'id', // count DISTINCT Event.id
    });

    const allBookings = await features.execute();

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = allBookings.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: allBookings,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public cancelBookingFromAdmin = catchAsyncService(
    async (data: { bookingId: number; isConfirmed: boolean; language: 'ar' | 'en' }, next: NextFunction) => {
      const { bookingId, isConfirmed = false, language } = data;
      if (!bookingId) return next(new AppError('missing bookingId', 400));
      const includeOptions = [
        'tickets',
        {
          model: this.Event,
          as: 'event',
          include: [{ model: this.Supervisor, as: 'supervisor', include: [{ model: this.User, as: 'user' }] }],
        },
        { model: this.NormalUser, as: 'user', include: [{ model: this.User, as: 'user' }] },
      ];

      const transaction = await this.sequelize.transaction();
      const booking = await this.Booking.findByPk(bookingId, {
        include: includeOptions,
        transaction,
      });
      if (!booking) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.BookingNotFound'), 404));
      }
      const warnings: CancelWarnings = {
        isPaid: booking.paymentStatus === 'completed',
        isPendingApproval: booking.event!.needApproveFromSupervisor && booking.status === 'pending',
      };

      if (booking.status === 'cancelled') {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.bookingCanceledBefore'), 404));
      }
      if (!isConfirmed) {
        await transaction.rollback();
        return {
          status: 'pending_confirmation',
          warnings,
          messages: [
            warnings.isPaid ? 'User has paid for this booking.' : '',
            warnings.isPendingApproval ? 'Booking is pending supervisor approval.' : '',
          ].filter(Boolean),
        };
      }
      const result = await this.cancelBookingCore(bookingId, transaction, 'admin', next);
      if (!result) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.BookingNotFound'), 404));
      }

      let paymentMethodName = null;
      if (booking.paymentMethodId) {
        const paymentMethod = await allEPaymentService.getOnePaymentByID(booking.paymentMethodId, transaction, next);
        paymentMethodName = paymentMethod;
      }
      if (paymentMethodName === 'MTN' && booking.paymentStatus === 'completed') {
        const initRefund = await MTNEPaymentService.initRefund(booking.id, language, transaction, next);
        if (!initRefund) {
          await transaction.rollback();
          return next(new AppError(errorMessage('error.BookingNotFound'), 404));
        }
        const confirmRefund = await MTNEPaymentService.confirmRefund(booking.id, language, transaction, next);
        if (!confirmRefund) {
          await transaction.rollback();
          return next(new AppError(errorMessage('error.BookingNotFound'), 404));
        }
      }

      await transaction.commit();

      const userType = 'normalUser';

      const notificationPayload = {
        title: commonMessage('common.adminCancelBookingTitle'),
        body: commonMessage('common.adminCancelBookingBody'),
        data: {
          bookId: String(booking.id),
          userType,
          userId: String(booking.user.userId),
          type: NotificationTypes.CANCELBOOKINGFROMADMIN,
          uniqueValue: booking.user.mobileNumber,
        },
        type: NotificationTypes.CANCELBOOKINGFROMADMIN,
      };
      PushNotificationService.sendToUser(booking.user.userId, notificationPayload, userType);
      return { status: 'success', booking: result };
    },
  );

  public cancelBookingUser = catchAsyncService(
    async (data: { bookingId: number; userId: number }, next: NextFunction) => {
      const transaction = await this.sequelize.transaction();
      try {
        const { bookingId, userId } = data;
        if (!bookingId) return next(new AppError('missing bookingId', 400));
        const includeOptions = [
          'tickets',
          {
            model: this.Event,
            as: 'event',
            include: [{ model: this.Supervisor, as: 'supervisor', include: [{ model: this.User, as: 'user' }] }],
          },
          { model: this.NormalUser, as: 'user', include: [{ model: this.User, as: 'user' }] },
        ];

        const booking = await this.Booking.findByPk(bookingId, { include: includeOptions, transaction });
        if (!booking) {
          await transaction.rollback();
          return next(new AppError(errorMessage('error.BookingNotFound'), 404));
        }
        if (booking.userId !== userId) {
          await transaction.rollback();
          return next(new AppError(errorMessage('error.Unauthorized to access'), 403));
        }
        if (booking.paymentStatus !== 'pending') {
          await transaction.rollback();
          return next(new AppError(errorMessage('error.BookingNotPending'), 400));
        }

        const result = await this.cancelBookingCore(bookingId, transaction, 'user', next);
        if (!result) return;
        await transaction.commit();
        return { status: 'success', booking: result };
      } catch (err: any) {
        await transaction.rollback();
        throw next(new AppError(err.message, 400));
      }
    },
  );

  public cancelBookingSupervisor = catchAsyncService(
    async (data: { bookingId: number; supervisorId: number }, next: NextFunction) => {
      const { bookingId, supervisorId } = data;
      if (!bookingId) return next(new AppError('missing bookingId', 400));
      const transaction = await this.sequelize.transaction();
      const includeOptions = [
        'tickets',
        {
          model: this.Event,
          as: 'event',
          include: [{ model: this.Supervisor, as: 'supervisor', include: [{ model: this.User, as: 'user' }] }],
        },
        { model: this.NormalUser, as: 'user', include: [{ model: this.User, as: 'user' }] },
      ];

      const booking = await this.Booking.findByPk(bookingId, {
        include: includeOptions,
        transaction,
      });
      if (!booking) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.BookingNotFound'), 404));
      }
      if (booking.event.supervisorId !== supervisorId) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.UnauthorizedSupervisor'), 403));
      }
      if (
        booking.event?.needApproveFromSupervisor &&
        booking.status === 'approved' &&
        booking.paymentStatus === 'completed'
      ) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.BookingIsPaidSupervisor'), 400));
      }
      if (!booking.event?.needApproveFromSupervisor || booking.status !== 'pending') {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.BookingNotPendingSupervisor'), 400));
      }
      const result = await this.cancelBookingCore(bookingId, transaction, 'supervisor', next);
      if (!result) return;
      await transaction.commit();

      const userType = 'normalUser';

      const notificationPayload = {
        title: commonMessage('common.supervisorCancelBookingTitle'),
        body: commonMessage('common.supervisorCancelBookingBody'),
        data: {
          bookId: String(booking.id),
          userType,
          userId: String(booking.user.userId),
          type: NotificationTypes.CANCELBOOKINGFROMSUPERVISOR,
          uniqueValue: booking.user.mobileNumber,
        },
        type: NotificationTypes.CANCELBOOKINGFROMSUPERVISOR,
      };
      PushNotificationService.sendToUser(booking.user.userId, notificationPayload, userType);

      return { status: 'success', booking: result };
    },
  );

  public createBooking = catchAsyncNext(async (req: CustomRequest, next: NextFunction, data: CreateBookingDto) => {
    const { eventId, userId, ticketsCount, ticketOption, discountCode, isPaperCopy, note } = data;

    const isAllowed = validateFieldsNames(this.allowedCreateBookingFields, Object.keys(data));
    if (isAllowed !== true) {
      return next(new AppError(`Invalid fields: ${isAllowed.join(', ')}`, 400));
    }
    if (!(await validateForeignKey(Event, eventId, 'Event'))) return next(new AppError('Invalid eventId', 400));
    if (!(await validateForeignKey(NormalUser, userId, 'NormalUser'))) return next(new AppError('Invalid userId', 400));

    const transaction = await this.sequelize.transaction();
    let shouldRollback = false;

    const event = await Event.findByPk(eventId, { transaction });
    if (!event) {
      shouldRollback = true;
      await transaction.rollback();
      return next(new AppError(errorMessage('error.eventsNotFound'), 404));
    }

    if (event.startApplyDate > new Date(Date.now() + 3 * 60 * 60 * 1000))
      return next(new AppError(errorMessage('error.startApplyDateNotComeYet'), 400));
    if (event.endApplyDate < new Date(Date.now()))
      return next(new AppError(errorMessage('error.endApplyDateIsOver'), 400));

    if (event.attendanceType === AttendanceType.WOMENONLY && req.normalUserFromReq?.gender !== Gender.Female)
      return next(new AppError(errorMessage('error.womenOnly'), 400));
    if (event.attendanceType === AttendanceType.MENONLY && req.normalUserFromReq?.gender !== Gender.Male)
      return next(new AppError(errorMessage('error.menOnly'), 400));
    if (event.availableTickets! < ticketsCount) {
      shouldRollback = true;
      await transaction.rollback();
      const plural = event.availableTickets! > 1 ? 's' : '';
      const pluralRequested = ticketsCount > 1 ? 's' : '';
      return next(
        new AppError(
          errorMessage('error.notEnoughTickets', {
            available: event.availableTickets,
            plural,
            requested: ticketsCount,
            pluralRequested,
          }),
          400,
        ),
      );
    }

    const ticketData = event.ticketOptionsAndPrices[ticketOption as keyof typeof event.ticketOptionsAndPrices];
    if (!ticketData) {
      shouldRollback = true;
      await transaction.rollback();
      return next(new AppError(`Invalid ticket option: ${ticketOption}`, 400));
    }

    let ticketPrice = ticketData.price;
    let profit = event.profit || 0;

    let discount;
    let totalPrice = ticketPrice + profit;
    if (discountCode) {
      discount = await Discount.findOne({ where: { eventId, code: discountCode } });
      if (!discount) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.discountCodeNotFound'), 404));
      }

      discount.isFixedValue
        ? (totalPrice = ticketPrice + profit - discount.value)
        : (totalPrice = Math.ceil(((ticketPrice + profit) * (100 - discount.value)) / 100));

      if (totalPrice < 0) totalPrice = 0;

      if (discount.usageCount) {
        if (
          discount.usageLimit !== null &&
          discount.usageLimit !== undefined &&
          discount.usageCount >= discount.usageLimit
        ) {
          await transaction.rollback();
          return next(new AppError(errorMessage('error.discountCodeMaxUsageReached'), 400));
        }
        discount.usageCount = discount.usageCount + ticketsCount;
      }
    }
    const totalTicketPriceWithoutDiscount = (ticketData.price + profit) * ticketsCount;

    const status = event.needApproveFromSupervisor ? BookTicketStatus.PENDING : BookTicketStatus.APPROVED;

    const createdAt = new Date();
    let cancelAfter = null;
    if (status === BookTicketStatus.APPROVED) {
      cancelAfter = calculateCancelAfter(createdAt, event.endApplyDate, event.endEventHour);
    }

    // if (cancelAfter) cancelAfter = new Date(cancelAfter.getTime() - 3 * 60 * 60 * 1000);

    const booking = await Booking.create(
      {
        eventId,
        userId,
        ticketsCount,
        ticketOption,
        ticketPrice,
        discountCode,
        totalPrice,
        status,
        paymentStatus: BookTicketPaymentStatus.PENDING,
        isPaperCopy,
        note,
        cancelAfter,
        // totalProfit,
        // totalProfitWithDiscount,
      },
      { transaction, validate: true },
    );

    if (!event.needApproveFromSupervisor && event.availableTickets! - ticketsCount === 0) {
      await Event.update(
        { availableTickets: event.availableTickets! - ticketsCount, eventStatus: EventStatus.SOLDOUT },
        { where: { id: event.id }, transaction },
      );
    }
    if (!event.needApproveFromSupervisor && event.availableTickets !== 0) {
      await Event.update(
        { availableTickets: event.availableTickets! - ticketsCount },
        { where: { id: event.id }, transaction },
      );
    }

    await event.reload({ transaction });
    await transaction.commit();

    return {
      booking: {
        ...booking.get({ plain: true }),
        // totalTicketPrice,
        // totalProfit,
        // totalProfitWithDiscount,
        // ticketPriceWithoutDiscount,
        totalPrice,
        totalTicketPriceWithoutDiscount,
        event,
      },
    };
  });

  public approveBooking = catchAsyncService(async (data: any, next: NextFunction) => {
    const { bookingId, supervisorId } = data;

    const transaction = await this.sequelize.transaction();
    let shouldRollback = false;

    const includeOptions = [
      'tickets',
      {
        model: this.Event,
        as: 'event',
        include: [{ model: this.Supervisor, as: 'supervisor', include: [{ model: this.User, as: 'user' }] }],
      },
      { model: this.NormalUser, as: 'user', include: [{ model: this.User, as: 'user' }] },
    ];

    const booking = await Booking.findByPk(bookingId, {
      // include: ['tickets', { model: this.NormalUser, as: 'user' }],
      include: includeOptions,
      transaction,
    });
    if (!booking) {
      shouldRollback = true;
      await transaction.rollback();
      return next(new AppError(errorMessage('error.BookingNotFound'), 404));
    }
    if (booking.status !== 'pending') {
      shouldRollback = true;
      await transaction.rollback();
      return next(new AppError(errorMessage('error.BookingNotPending'), 400));
    }

    const event = await Event.findByPk(booking.eventId);
    if (!event) {
      shouldRollback = true;
      await transaction.rollback();
      return next(new AppError(errorMessage('error.EventNotFound'), 404));
    }
    if (supervisorId !== event?.supervisorId) {
      shouldRollback = true;
      await transaction.rollback();
      return next(new AppError(errorMessage('you cannot approve non related booking'), 404));
    }

    if (event.availableTickets! < booking.ticketsCount) {
      shouldRollback = true;
      await transaction.rollback();
      const plural = event.availableTickets! > 1 ? 's' : '';
      const pluralRequested = booking.ticketsCount > 1 ? 's' : '';
      return next(
        new AppError(
          errorMessage('error.notEnoughTickets', {
            available: event.availableTickets,
            plural,
            requested: booking.ticketsCount,
            pluralRequested,
          }),
          400,
        ),
      );
    }

    await Event.update(
      { availableTickets: event.availableTickets! - booking.ticketsCount },
      { where: { id: event.id }, transaction, validate: true },
    );

    const createdAt = new Date();
    let cancelAfter = calculateCancelAfter(createdAt, event.endApplyDate, event.endEventHour);
    // const cancelAfter = new Date(
    //   Math.min(createdAt.getTime() + 24 * 60 * 60 * 1000, event.endApplyDate.getTime() - 2 * 60 * 60 * 1000),
    // );
    // if (cancelAfter) cancelAfter = new Date(cancelAfter.getTime() - 3 * 60 * 60 * 1000);

    await booking.update({ status: BookTicketStatus.APPROVED, cancelAfter }, { transaction });
    await transaction.commit();

    const userType = 'normalUser';

    const notificationPayload = {
      title: commonMessage('common.approveBookingTitle'),
      body: commonMessage('common.approveBookingBody'),
      data: {
        bookId: String(booking.id),
        eventId: String(event.id),
        eventName: event.eventName,
        userType,
        userId: String(booking.user.userId),
        type: NotificationTypes.APPROVEBOOKING,
        uniqueValue: booking.user.mobileNumber,
      },
      type: NotificationTypes.APPROVEBOOKING,
    };
    PushNotificationService.sendToUser(booking.user.userId, notificationPayload, userType);

    return booking;
  });

  public initPayment = catchAsyncService(
    async (
      //TODO: create Zod Validation
      data: { bookId: number; mobileNumber: string; ServiceName: string; language: 'ar' | 'en' },
      next: NextFunction,
    ) => {
      const parsedData = await initPayment.safeParseAsync(data);
      if (!parsedData.success) {
        return next(parsedData.error);
      }

      const { bookId, ServiceName, language, mobileNumber } = data;
      const serviceNameUpper = ServiceName.toUpperCase();

      const transaction = await this.sequelize.transaction();
      let shouldRollback = false;
      try {
        const booking = await Booking.findByPk(bookId, { transaction, include: [{ model: this.Event, as: 'event' }] });
        if (!booking) {
          shouldRollback = true;
          await transaction.rollback();
          return next(new AppError(errorMessage('error.BookingNotFound'), 404));
        }
        if (booking.status !== BookTicketStatus.APPROVED) {
          shouldRollback = true;
          await transaction.rollback();
          return next(new AppError(errorMessage('error.bookingPaymentBeforeApprove'), 400));
        }

        const handler = (this.paymentHandlers as any)[serviceNameUpper];
        if (!handler) {
          await transaction.rollback();
          throw new AppError(errorMessage('error.paymentMethodNotFound'), 400);
        }

        // const finalPrice = booking.totalPrice + booking.event.profit * booking.ticketsCount;
        const finalPrice = booking.totalPrice;

        const paymentData: { booking: any; mobileNumber: string; language: 'ar' | 'en'; finalPrice: number } = {
          booking,
          mobileNumber,
          language,
          finalPrice,
        };
        const paymentDataResend: { mobileNumber: string; language: 'ar' | 'en'; bookId: number } = {
          mobileNumber,
          language,
          bookId,
        };

        let paymentMethodId: number | undefined;

        if (booking.paymentStatus === BookTicketPaymentStatus.PENDING) {
          await this.paymentVerificationService.changeEPaymentVerificationStatusService(
            serviceNameUpper as PaymentServiceName,
            bookId,
            transaction,
          );
          //MARKER
          paymentMethodId = await handler.init(paymentData, transaction, next);
        } else if (booking.paymentStatus === BookTicketPaymentStatus.INIT) {
          await this.paymentVerificationService.changeEPaymentVerificationStatusService(
            serviceNameUpper as PaymentServiceName,
            bookId,
            transaction,
          );
          paymentMethodId = await handler.resend(paymentDataResend, transaction, next);
        } else {
          await transaction.rollback();
          throw new AppError(errorMessage('error.paymentAlreadyProcessed'), 400);
        }

        await booking.update(
          { paymentStatus: BookTicketPaymentStatus.INIT, paymentMethodId: paymentMethodId },
          { transaction, validate: true },
        );

        await booking.reload({ transaction });

        const otpStatus = await this.paymentVerificationService.getExistingVerificationService(
          serviceNameUpper as PaymentServiceName,
          bookId,
          transaction,
        );

        await transaction.commit();

        const data = { booking, otpStatus };

        return data;
      } catch (error: any) {
        await transaction.rollback();
        throw next(new AppError(error.message, 400));
      }
    },
  );

  public processPayment = catchAsyncService(
    async (
      data: { bookingId: number; userId: number; code: string; ServiceName: string; language: 'ar' | 'en' },
      next: NextFunction,
    ) => {
      const { bookingId, userId, code } = data;
      const transaction = await this.sequelize.transaction();
      let shouldRollback = false;
      const booking = await Booking.findByPk(bookingId, { include: ['tickets'], transaction });
      if (!booking) {
        shouldRollback = true;
        await transaction.rollback();
        return next(new AppError(errorMessage('error.BookingNotFound'), 404));
      }
      if (booking.status !== BookTicketStatus.APPROVED) {
        shouldRollback = true;
        await transaction.rollback();
        return next(new AppError(errorMessage('error.bookingPaymentBeforeApprove'), 400));
      }
      if (booking.paymentStatus === BookTicketPaymentStatus.COMPLETED) {
        shouldRollback = true;
        await transaction.rollback();
        return next(new AppError(errorMessage('error.paymentAlreadyProcessed'), 400));
      }

      if (booking.paymentStatus !== BookTicketPaymentStatus.INIT) {
        shouldRollback = true;
        await transaction.rollback();
        return next(new AppError(errorMessage('error.paymentNotInitialized'), 400));
      }

      let paymentMethodId: number | undefined;
      const paymentData = { Code: code, language: data.language, bookId: booking.id };

      switch (data.ServiceName.toUpperCase()) {
        case 'MTN':
          paymentMethodId = await this.processMTNPayment(paymentData, transaction, next);
          break;

        case 'SYRIATEL':
          paymentMethodId = await this.processSyriatelPayment(paymentData, transaction, next);
          break;

        default:
          await transaction.rollback();
          throw new AppError(errorMessage('error.paymentMethodNotFound'), 400);
      }

      const user = await NormalUser.findByPk(userId, { include: { model: User, as: 'user' } });

      if (!user?.user?.firstName) return next(new AppError('something goes wrong', 400));
      const fullName = `${user?.user?.firstName} ${user?.user?.lastName}`;

      await booking.update({ paymentStatus: BookTicketPaymentStatus.COMPLETED }, { transaction, validate: true });
      const ticketData: CreateTicketDTO = {
        bookingId: booking.id,
        username: fullName,
        scans: booking.ticketsCount,
        transaction,
      };
      await this.ticketService.createTicket(ticketData, next);
      await booking.reload({ include: [{ model: Ticket, as: 'tickets' }], transaction });

      await transaction.commit();
      return booking;
    },
  );

  // we may delete it (deprecated)
  public resendPaymentCode = catchAsyncService(
    async (
      data: { bookId: number; mobileNumber: string; ServiceName: string; language: 'ar' | 'en' },
      next: NextFunction,
    ) => {
      const { bookId, mobileNumber, ServiceName, language } = data;

      if (!bookId) return next(new AppError(errorMessage('error.BookingNotFound'), 404));

      const transaction = await this.sequelize.transaction();

      const booking = await Booking.findByPk(bookId, { transaction, include: [{ model: this.Event, as: 'event' }] });
      if (!booking) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.BookingNotFound'), 404));
      }
      if (booking.status !== BookTicketStatus.APPROVED) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.bookingPaymentBeforeApprove'), 400));
      }
      if (booking.paymentStatus === BookTicketPaymentStatus.COMPLETED) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.paymentAlreadyProcessed'), 400));
      }
      if (booking.paymentStatus === BookTicketPaymentStatus.INIT) {
        let paymentMethodId: number | undefined;
        const paymentData = { mobileNumber, bookId, language };

        switch (ServiceName.toUpperCase()) {
          case 'MTN':
            paymentMethodId = await this.resendCodeMTNPayment(paymentData, transaction, next);
            break;

          case 'SYRIATEL':
            paymentMethodId = await this.resendCodeSyriatelPayment(paymentData, transaction, next);
            break;

          default:
            await transaction.rollback();
            throw new AppError(errorMessage('error.paymentMethodNotFound'), 400);
        }
      }
      if (booking.paymentStatus !== BookTicketPaymentStatus.INIT) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.paymentNotInitialized'), 400));
      }

      await transaction.commit();
      return booking;
    },
  );

  public getPaymentNotification = catchAsyncService(
    async (data: { userId: number; isAccepted: boolean }, next: NextFunction) => {
      const paymentCount = await Booking.count({
        where: { paymentStatus: BookTicketPaymentStatus.COMPLETED, userId: data.userId },
      });
      if ((paymentCount === 1 || paymentCount % 3 === 0) && paymentCount !== 0 && !data.isAccepted) return true;
      return false;
    },
  );

  public allUserBooking = catchAsyncService(async (data: { userId: number; eventId: number }, next: NextFunction) => {
    const { userId, eventId } = data;
    const allBookings = await Booking.findOne({ where: { userId, eventId } });
    if (allBookings) return true;
    return false;
  });

  public getPaymentStatus = catchAsyncService(
    async (data: { userId: number; bookId: number; ServiceName: string }, next: NextFunction) => {
      const { userId, bookId, ServiceName } = data;

      // const transaction = await sequelize.transaction();

      const book = await this.Booking.findByPk(bookId);
      if (book?.userId !== userId) return next(new AppError(errorMessage('error.this bookiing is not for u'), 400));

      if (!book) return next(new AppError(errorMessage('error.BookingNotFound'), 404));
      let paymentMethodId;

      const paymentStatus = await PaymentVerificationService.getExistingVerification(
        ServiceName as PaymentServiceName,
        book.id,
      );
      return paymentStatus;
    },
  );

  public getMostTicketsSales = async (startDate?: Date, endDate?: Date) => {
    const where: WhereOptions = {
      paymentStatus: BookTicketPaymentStatus.COMPLETED,
      status: BookTicketStatus.APPROVED,
    };

    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [startDate, endDate] };
    }
    const topEventTypes = await this.Booking.findAll({
      where,
      attributes: [
        [col('event.eventTypeRelation.typeName'), 'eventType'],
        [fn('SUM', col('ticketsCount')), 'totalTicketsSold'],
      ],
      include: [
        {
          model: this.Event,
          as: 'event',
          attributes: [],
          include: [{ model: EventType, as: 'eventTypeRelation', attributes: [] }],
        },
      ],
      group: [col('event.eventTypeRelation.typeName')],
      order: [[fn('SUM', col('ticketsCount')), 'DESC']],
      limit: 3,
      raw: true,
    });

    const topByGender = await this.Booking.findAll({
      where,
      attributes: [
        [col('user.gender'), 'gender'],
        [fn('SUM', col('ticketsCount')), 'totalTicketsSold'],
      ],
      include: [{ model: this.NormalUser, as: 'user', attributes: [] }],
      group: [col('user.gender')],
      order: [[fn('SUM', col('ticketsCount')), 'DESC']],
      limit: 1,
      raw: true,
    });

    const topProvinces = await this.Booking.findAll({
      where,
      attributes: [
        [col('event.provinceRelation.provinceName'), 'province'],
        [fn('SUM', col('ticketsCount')), 'totalTicketsSold'],
      ],
      include: [
        {
          model: this.Event,
          as: 'event',
          attributes: [],
          include: [{ model: Province, as: 'provinceRelation', attributes: [] }],
        },
      ],
      group: [col('event.provinceRelation.provinceName')],
      order: [[fn('SUM', col('ticketsCount')), 'DESC']],
      limit: 3,
      raw: true,
    });

    const ageGroupLiteral = literal(`
  CASE
    WHEN DATE_PART('year', AGE("user"."birthDate")) BETWEEN 18 AND 25 THEN '18-25'
    WHEN DATE_PART('year', AGE("user"."birthDate")) BETWEEN 26 AND 35 THEN '26-35'
    WHEN DATE_PART('year', AGE("user"."birthDate")) BETWEEN 36 AND 45 THEN '36-45'
    WHEN DATE_PART('year', AGE("user"."birthDate")) BETWEEN 46 AND 55 THEN '46-55'
    ELSE '55+'
  END
`) as any;

    const topAgeGroups = await this.Booking.findAll({
      where,
      attributes: [
        [ageGroupLiteral, 'ageGroup'],
        [fn('SUM', col('ticketsCount')), 'totalTicketsSold'],
      ],
      include: [{ model: this.NormalUser, as: 'user', attributes: [] }],
      group: [ageGroupLiteral],
      order: [[fn('SUM', col('ticketsCount')), 'DESC']],
      limit: 3,
      raw: true,
    });

    return { topEventTypes, topByGender, topProvinces, topAgeGroups };
  };

  public completionRate = async (startDate?: Date, endDate?: Date) => {
    const where: WhereOptions = {};

    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [startDate, endDate] };
    }

    const totalApproved = await this.Booking.count({ where: { ...where, status: BookTicketStatus.APPROVED } });

    if (totalApproved === 0) {
      return [
        { date: endDate ?? new Date(), stage: 'In Progress', usersCount: 0, percent: 0 },
        { date: endDate ?? new Date(), stage: 'Initialized', usersCount: 0, percent: 0 },
        { date: endDate ?? new Date(), stage: 'Completed', usersCount: 0, percent: 0 },
      ];
    }

    const inProgressCount = await this.Booking.count({
      where: {
        ...where,
        status: BookTicketStatus.APPROVED,
        paymentStatus: {
          [Op.notIn]: [BookTicketPaymentStatus.COMPLETED, BookTicketPaymentStatus.PENDING],
        },
      },
    });

    const initCount = await this.Booking.count({
      where: {
        ...where,
        status: BookTicketStatus.APPROVED,
        paymentStatus: BookTicketPaymentStatus.PENDING,
      },
    });

    const completedCount = await this.Booking.count({
      where: {
        ...where,
        status: BookTicketStatus.APPROVED,
        paymentStatus: BookTicketPaymentStatus.COMPLETED,
      },
    });

    const total = await this.Booking.count({ where });
    const formatPercent = (count: number) => Number(((count / total) * 100).toFixed(2));
    const reportDate = endDate ?? new Date();

    return [
      {
        date: reportDate,
        stage: 'Approved',
        usersCount: inProgressCount,
        percent: formatPercent(inProgressCount),
      },
      {
        date: reportDate,
        stage: 'Initialized',
        usersCount: initCount,
        percent: formatPercent(initCount),
      },
      {
        date: reportDate,
        stage: 'Completed',
        usersCount: completedCount,
        percent: formatPercent(completedCount),
      },
    ];
  };

  public async totalRevenueReport(startDate?: Date, endDate?: Date) {
    const [minDateResult] = await this.Booking.sequelize!.query<{ min_date: string }>(
      `SELECT MIN("updatedAt") AS min_date FROM "BookTicket";`,
      { type: QueryTypes.SELECT },
    );

    const start = startDate ?? (minDateResult?.min_date ? new Date(minDateResult.min_date) : new Date()); // fallback to now if table is empty

    const end = endDate ?? new Date();

    const query = `
    WITH date_series AS (
      SELECT
        generate_series(
          date_trunc('day', $1::timestamptz),
          date_trunc('day', $2::timestamptz),
          interval '1 day'
        ) AS date
    ),
    revenue_data AS (
      SELECT
        DATE("updatedAt" AT TIME ZONE 'UTC' AT TIME ZONE '+03:00') AS date,
        SUM("totalPrice") AS total_revenue
      FROM "BookTicket"
      WHERE "status" = 'approved'
        AND "paymentStatus" = 'completed'
        AND "updatedAt" BETWEEN $1 AND $2
      GROUP BY 1
    )
    SELECT
      to_char(ds.date, 'YYYY-MM-DD') AS date,
      COALESCE(rd.total_revenue, 0) AS totalRevenue
    FROM date_series ds
    LEFT JOIN revenue_data rd ON ds.date = rd.date
    ORDER BY ds.date;
  `;

    const result = await this.Booking.sequelize!.query(query, {
      bind: [start, end],
      type: QueryTypes.SELECT,
    });

    return result;
  }

  public paymentMethodsReport = async (startDate?: Date, endDate?: Date) => {
    const sequelize = this.Booking.sequelize!;

    // get earliest date
    const [minDateResult] = await sequelize.query<{ min_date: string }>(
      `
      SELECT LEAST(
        COALESCE((SELECT MIN("createdAt") FROM "SyriatelEPayment"), now()),
        COALESCE((SELECT MIN("createdAt") FROM "MTNEPayment"), now())
      ) AS min_date;
    `,
      { type: QueryTypes.SELECT },
    );

    const start = startDate ?? (minDateResult?.min_date ? new Date(minDateResult.min_date) : new Date());
    const end = endDate ?? new Date();

    const query = `
    SELECT
      u."date"::date,
      u."paymentMethodId"::int,
      SUM(u."totalOperations"::int) AS "totalOperations",
      SUM(u."failureCount"::int) AS "failureCount",
      ROUND(
        CASE WHEN SUM(u."totalOperations"::decimal) = 0 THEN 0
             ELSE (SUM(u."failureCount"::decimal) / SUM(u."totalOperations"::decimal) * 100)
        END, 2
      ) AS "failureRate"
    FROM (
      -- Syriatel payments
      SELECT
        DATE("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE '+03:00') AS "date",
        "paymentMethodId"::int AS "paymentMethodId",
        COUNT(*)::int AS "totalOperations",
        SUM(CASE WHEN "status" NOT IN ('success', 'init') THEN 1 ELSE 0 END)::int AS "failureCount"
      FROM "SyriatelEPayment"
      WHERE "createdAt" BETWEEN :start AND :end
      GROUP BY DATE("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE '+03:00'), "paymentMethodId"

      UNION ALL

      -- MTN payments
      SELECT
        DATE("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE '+03:00') AS "date",
        "EPaymentId"::int AS "paymentMethodId",
        COUNT(*)::int AS "totalOperations",
        SUM(CASE WHEN "Status" NOT IN (1, 9) THEN 1 ELSE 0 END)::int AS "failureCount"
      FROM "MTNEPayment"
      WHERE "createdAt" BETWEEN :start AND :end
      GROUP BY DATE("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE '+03:00'), "EPaymentId"
    ) u
    GROUP BY u."date", u."paymentMethodId"
    ORDER BY u."date" ASC, u."paymentMethodId" ASC;
  `;

    const result = await sequelize.query(query, {
      replacements: { start, end },
      type: QueryTypes.SELECT,
    });

    return result;
  };

  public revenueAnalysis = async (startDate?: Date, endDate?: Date) => {
    const where: WhereOptions = { status: BookTicketStatus.APPROVED, paymentStatus: BookTicketPaymentStatus.COMPLETED };

    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [startDate, endDate] };
    }

    const booking = await this.Booking.findAll({
      attributes: [
        [fn('DATE', literal(`"BookTicket"."updatedAt" AT TIME ZONE 'UTC' AT TIME ZONE '+03:00'`)), 'date'],
        [col('event.id'), 'eventId'],
        [col('event.eventName'), 'eventName'],
        [col('event.eventTypeRelation.id'), 'eventTypeId'],
        [col('event.eventTypeRelation.typeName'), 'typeName'],
        [col('event.provinceRelation.id'), 'provinceId'],
        [col('event.provinceRelation.provinceName'), 'provinceName'],
        [col('paymentMethod.id'), 'paymentMethodId'],
        [col('paymentMethod.ServiceName'), 'serviceName'],
        [col('BookTicket.ticketOption'), 'ticketOption'],
        [fn('SUM', col('BookTicket.totalPrice')), 'totalRevenue'],
        [fn('SUM', literal(`("event"."profit" * "BookTicket"."ticketsCount")`)), 'totalProfit'],
      ],
      include: [
        {
          model: this.Event,
          as: 'event',
          attributes: [],
          include: [
            { model: EventType, as: 'eventTypeRelation', attributes: [] },
            { model: Province, as: 'provinceRelation', attributes: [] },
          ],
        },
        { model: EPayment, as: 'paymentMethod', attributes: [] },
      ],
      where,
      group: [
        fn('Date', literal(`"BookTicket"."updatedAt" AT TIME ZONE 'UTC' AT TIME ZONE '+03:00'`)),
        col('event.id'),
        col('event.eventTypeRelation.id'),
        col('event.provinceRelation.id'),
        col('paymentMethod.id'),
        col('BookTicket.ticketOption'),
        col('event.eventName'),
        col('event.eventTypeRelation.typeName'),
        col('event.provinceRelation.provinceName'),
        col('paymentMethod.ServiceName'),
      ],
      order: [
        [literal(`date`), 'ASC'],
        [col('eventId'), 'ASC'],
      ],
      raw: true,
    });

    return booking;
  };

  public ticketsSoldReport = async (startDate?: Date, endDate?: Date) => {
    const where: WhereOptions = {
      paymentStatus: BookTicketPaymentStatus.COMPLETED,
      status: BookTicketStatus.APPROVED,
    };

    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [startDate, endDate] };
    }

    const bookings = await this.Booking.findAll({
      attributes: [
        [fn('DATE', literal(`"BookTicket"."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE '+03:00'`)), 'date'],
        [col('event.eventName'), 'eventName'],
        'ticketOption',
        [fn('SUM', col('BookTicket.ticketsCount')), 'totalTicketsSold'],
        [fn('SUM', col('BookTicket"."ticketPrice')), 'totalRevenue'],
      ],
      include: [
        {
          model: this.Event,
          as: 'event',
          attributes: [],
        },
      ],
      where,
      group: [
        fn('DATE', literal(`DATE("BookTicket"."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE '+03:00')`)),
        col('event.eventName'),
        col('BookTicket.ticketOption'),
      ],
      order: [[literal(`DATE("BookTicket"."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE '+03:00')`), 'ASC']],
      raw: true,
    });

    return bookings;
  };

  private async cancelBookingCore(bookingId: number, transaction: Transaction, user: string, next: NextFunction) {
    const booking = await this.Booking.findByPk(bookingId, { transaction });
    if (!booking) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.BookingNotFound'), 404));
    }
    if (booking.status === BookTicketStatus.CANCELLED) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.bookingCanceledBefore'), 400));
    }
    if (booking.paymentStatus === BookTicketPaymentStatus.COMPLETED) {
      await this.ticketService.cancelTicket({ bookingId, transaction }, next);
    }

    if (user === 'user') await booking.update({ status: BookTicketStatus.CANCELLED }, { transaction, validate: true });
    if (user === 'admin')
      await booking.update({ status: BookTicketStatus.REJECTEDBYSYSTEMADMIN }, { transaction, validate: true });
    if (user === 'supervisor')
      await booking.update({ status: BookTicketStatus.REJECTED }, { transaction, validate: true });

    const event = await this.Event.findByPk(booking.eventId, { transaction });
    if (event) {
      await event.update(
        {
          availableTickets: event.availableTickets! + booking.ticketsCount,
          eventStatus: EventStatus.AVAILABLE,
        },
        { transaction },
      );
    }
    return booking;
  }

  public getUsersBookForEvent = async (eventId: number) => {
    const users = await this.Booking.findAll({
      where: { eventId, paymentStatus: BookTicketPaymentStatus.COMPLETED },
      include: [{ model: NormalUser, as: 'user' }],
    });
    const usersId: number[] = [];
    users.forEach((user) => usersId.push(user.userId));
    return users;
  };

  private async initMTNPayment(
    paymentDate: { booking: any; mobileNumber: string; language: 'ar' | 'en'; finalPrice: number },
    transaction: Transaction,
    next: NextFunction,
  ): Promise<number> {
    const { booking, mobileNumber, language, finalPrice } = paymentDate;
    let cancelAfterInMinutes = calculateCancelAfterInMinutes(booking.cancelAfter);
    cancelAfterInMinutes = 1;

    if (cancelAfterInMinutes < 0) {
      await transaction.rollback();
      throw new AppError(errorMessage('error.overDuePaymentTime'), 400);
    }

    const paymentMethodId = await allEPaymentService.getOnePaymentService('MTN', transaction, next);

    if (!paymentMethodId) {
      await transaction.rollback();
      throw new AppError('cannot find MTN payment Method ID', 404);
    }

    const invoiceData: CreateMTNInvoiceDTO = { Amount: finalPrice, TTL: cancelAfterInMinutes };
    const invoice = await MTNEPaymentService.createInvoice(invoiceData, booking.id, language, transaction, next);
    if (!invoice) {
      await transaction.rollback();
      throw new AppError(errorMessage('error.createInvoiceError'), 400);
    }

    const paymentData = { Phone: mobileNumber };
    const payment = await MTNEPaymentService.initPayment(paymentData, booking.id, language, transaction, next);
    if (!payment) {
      await transaction.rollback();
      throw new AppError(errorMessage('error.initPaymentError'), 400);
    }
    return paymentMethodId;
  }

  private async processMTNPayment(
    paymentData: { Code: string; language: 'ar' | 'en'; bookId: number },
    transaction: Transaction,
    next: NextFunction,
  ): Promise<number> {
    const language = paymentData.language;
    const MTNPaymentData = { Code: paymentData.Code };

    const paymentMethodId = await allEPaymentService.getOnePaymentService('MTN', transaction, next);

    if (!paymentMethodId) {
      await transaction.rollback();
      throw new AppError('cannot find MTN payment Method ID', 404);
    }

    const payment = await MTNEPaymentService.confirmPayment(
      MTNPaymentData,
      paymentData.bookId,
      language,
      transaction,
      next,
    );

    if (!payment) {
      await transaction.rollback();
      throw new AppError(errorMessage('error.confirmPaymentError'), 400);
    }
    return paymentMethodId;
  }

  private async resendCodeMTNPayment(
    paymentData: { mobileNumber: string; language: 'ar' | 'en'; bookId: number },
    transaction: Transaction,
    next: NextFunction,
  ): Promise<number> {
    const language = paymentData.language;
    const MTNPaymentData = { Phone: paymentData.mobileNumber };

    const paymentMethodId = await allEPaymentService.getOnePaymentService('MTN', transaction, next);

    if (!paymentMethodId) {
      await transaction.rollback();
      throw new AppError('cannot find MTN payment Method ID', 404);
    }

    const resendPayment = await MTNEPaymentService.initPaymentResend(
      MTNPaymentData,
      paymentData.bookId,
      language,
      transaction,
      next,
    );

    if (!resendPayment) {
      await transaction.rollback();
      throw new AppError(errorMessage('error.confirmPaymentError'), 400);
    }
    return paymentMethodId;
  }

  private async initSyriatelPayment(
    paymentData: { booking: Booking; mobileNumber: string; language: string; finalPrice: number },
    transaction: Transaction,
    next: NextFunction,
  ): Promise<number> {
    const { booking, mobileNumber, language, finalPrice } = paymentData;

    const paymentMethodId = await allEPaymentService.getOnePaymentService('SYRIATEL', transaction, next);

    if (!paymentMethodId) {
      await transaction.rollback();
      throw new AppError('cannot find Syriatel payment Method ID', 404);
    }

    const paymentRequestData: SyriatelInitPaymentDTO = {
      customerMSISDN: mobileNumber.replace('963', '0'),
      amount: String(finalPrice),
      bookId: booking.id,
      paymentMethodId,
    };
    const requestPayment = await SyriatelEPaymentService.requestPayment(paymentRequestData, transaction, next);
    if (!requestPayment) {
      await transaction.rollback();
      throw new AppError(errorMessage('error.initPaymentError'), 400);
    }
    return paymentMethodId;
  }

  private async processSyriatelPayment(
    paymentData: { Code: string; language: 'ar' | 'en'; bookId: number },
    transaction: Transaction,
    next: NextFunction,
  ): Promise<number> {
    const SyriatelPaymentData = { OTP: paymentData.Code, bookId: Number(paymentData.bookId) };

    const paymentMethodId = await allEPaymentService.getOnePaymentService('SYRIATEL', transaction, next);

    if (!paymentMethodId) {
      await transaction.rollback();
      throw new AppError('cannot find SYRIATEL payment Method ID', 404);
    }

    const payment = await SyriatelEPaymentService.confirmPayment(SyriatelPaymentData, transaction, next);

    if (!payment) {
      await transaction.rollback();
      throw new AppError(errorMessage('error.confirmPaymentError'), 400);
    }
    return paymentMethodId;
  }

  private async resendCodeSyriatelPayment(
    paymentData: { mobileNumber: string; bookId: number; language: 'ar' | 'en' },
    transaction: Transaction,
    next: NextFunction,
  ): Promise<number> {
    const SyriatelResendPaymentData = { bookId: Number(paymentData.bookId) };

    const paymentMethodId = await allEPaymentService.getOnePaymentService('SYRIATEL', transaction, next);

    if (!paymentMethodId) {
      await transaction.rollback();
      throw new AppError('cannot find SYRIATEL payment Method ID', 404);
    }

    const payment = await SyriatelEPaymentService.resendCode(SyriatelResendPaymentData, transaction, next);

    if (!payment) {
      await transaction.rollback();
      throw new AppError(errorMessage('error.confirmPaymentError'), 400);
    }
    return paymentMethodId;
  }

  private paymentHandlers = {
    MTN: {
      init: this.initMTNPayment.bind(this),
      resend: this.resendCodeMTNPayment.bind(this),
    },
    SYRIATEL: {
      init: this.initSyriatelPayment.bind(this),
      resend: this.resendCodeSyriatelPayment.bind(this),
    },
  };

  private async createStoredProcedure() {
    try {
      await this.sequelize.query(`
      CREATE OR REPLACE PROCEDURE cancel_unpaid_bookings()
      LANGUAGE plpgsql AS $$
      BEGIN
        WITH cancelled AS (
          UPDATE "BookTicket"
          SET status = '${BookTicketStatus.AUTOCANCELLED}'
          WHERE "paymentStatus" <> 'completed'
          AND "cancelAfter" <= NOW() 
          AND status <> 'cancelled'
          And status <> '${BookTicketStatus.AUTOCANCELLED}'
          RETURNING id, "eventId", "ticketsCount"
        ),
        aggregated AS (
        SELECT "eventId", SUM("ticketsCount") AS total_tickets
        FROM cancelled
        GROUP BY "eventId"
        )
UPDATE "Event" e
  SET 
    "availableTickets" = e."availableTickets" + a.total_tickets,
    "eventStatus" = 'available'
  FROM aggregated a
  WHERE e.id = a."eventId";
END;
$$;
    `);
      console.log('Stored procedure cancel_unpaid_bookings created at:', new Date().toISOString());
    } catch (error: Error | unknown) {
      console.error('Failed to create stored procedure:', (error as Error).message);
      throw error;
    }
  }

  private async runImmediateCancellation() {
    if (this.lastImmediateRun && new Date().getTime() - this.lastImmediateRun.getTime() < 60_000) {
      console.log('Skipped immediate cancellation: Recent run at', this.lastImmediateRun.toISOString());
      return;
    }
    try {
      await this.sequelize.query('CALL cancel_unpaid_bookings()');
      this.lastImmediateRun = new Date();
      console.log('Immediate cancellation executed at', this.lastImmediateRun.toISOString());
    } catch (error: Error | unknown) {
      console.error('Immediate cancellation failed:', (error as Error).message);
    }
  }

  private async setupScheduler() {
    try {
      const [extensions] = await this.sequelize.query("SELECT * FROM pg_available_extensions WHERE name = 'pg_cron'");
      if (extensions.length > 0) {
        await this.setupPgCron();
      } else {
        console.log('pg_cron unavailable, falling back to node-cron');
        this.scheduleNodeCron();
      }
    } catch (error: Error | unknown) {
      console.error('Failed to check pg_cron availability:', (error as Error).message);
      this.scheduleNodeCron();
    }
  }

  private async setupPgCron() {
    try {
      await this.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_cron');
      await this.sequelize.query("SELECT cron.unschedule('cancel-unpaid')");
      await this.sequelize.query(`
          SELECT cron.schedule('cancel-unpaid', '1 * * * *', $$
          CALL cancel_unpaid_bookings();
        $$);
      `);
      console.log('pg_cron scheduled: cancel-unpaid every 1 minute.');
    } catch (error: Error | unknown) {
      console.error('pg_cron scheduling failed:', (error as Error).message);
      this.scheduleNodeCron();
    }
  }

  private scheduleNodeCron() {
    if (this.cronScheduled) {
      console.log('node-cron already scheduled, skipping');
      return;
    }
    cron.schedule('0 * * * * *', async () => {
      try {
        await this.sequelize.query('CALL cancel_unpaid_bookings()');
        console.log('(Cancel-Booking) Stored procedure called successfully at', new Date().toISOString());
      } catch (error: Error | unknown) {
        console.error('Stored procedure call failed:', (error as Error).message);
      }
    });
    this.cronScheduled = true;
    console.log('node-cron scheduled: cancel-unpaid every 1 minute.');
  }

  private allowedCreateBookingFields = [
    'eventId',
    'userId',
    'ticketsCount',
    'ticketOption',
    'discountCode',
    'isPaperCopy',
    'note',
    'usernames',
  ];
}

import { sequelize } from '../DB/sequelize.js';
import EPayment from '../models/allEPayment.model.js';
export default new BookingService(sequelize, new TicketService(sequelize));
