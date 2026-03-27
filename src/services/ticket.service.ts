import { col, fn, Op, Sequelize, Transaction } from 'sequelize';
import { NextFunction } from 'express';
import Ticket from '../models/ticket.model.js';
import AppError from '../utils/AppError.js';
import catchAsyncService from '../utils/catchAsyncService.js';
import catchAsyncNext from '../utils/catchAsyncReqNext.js';
import CreateTicketDTO from '../interfaces/ticket/createTicket.dto.js';
import BookTicket from '../models/BookTicket.model.js';
import Event from '../models/event.model.js';
import APIFeatures from '../utils/apiFeatures.js';
import { errorMessage } from '../modules/i18next.config';
import { sequelize } from '../DB/sequelize.js';
import { validateForeignKey } from '../utils/validateForeignKey.js';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto.js';
import scannerUserService, { ScannerUserService } from './scannerUser.service.js';
import EventType from '../models/eventType.model.js';
import Province from '../models/provinces.model.js';

// console.log(scannerUserService);
// console.log(ScannerUserService);

export class TicketService {
  private sequelize: Sequelize;
  private scannerUserService: ScannerUserService;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
    this.scannerUserService = scannerUserService;
  }

  public createTicket = catchAsyncService(async (data: CreateTicketDTO, next: NextFunction) => {
    const { bookingId, username, transaction, scans } = data;

    await validateForeignKey(BookTicket, bookingId, 'BookTicket');

    const existingTickets = await Ticket.findOne({ where: { bookingId }, transaction });
    if (existingTickets) {
      return existingTickets;
    }

    const lastTicket = await Ticket.findOne({ order: [['id', 'DESC']], transaction });
    const lastNumber = lastTicket ? parseInt(lastTicket.serialNumber.split('-')[1]) : 100000;
    const ticket = {
      bookingId,
      serialNumber: `TKT-${lastNumber + 1}`,
      username,
      scans,
      scanCounter: 0,
    };
    return Ticket.create(ticket, { transaction, validate: true });
  });

  public getAllTickets = catchAsyncNext(async (req, next: NextFunction) => {
    const includeOptions = [
      {
        model: BookTicket,
        as: 'booking',
      },
    ];
    const features = new APIFeatures(Ticket, req.query as unknown as Record<string, string>, {
      include: includeOptions,
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await Ticket.count({
      where: features.query.where,
      include: includeOptions,
    });
    const allTickets = await features.execute();
    if (!allTickets) return next(new AppError(errorMessage('error.emptyTicket'), 404));

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = allTickets.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: allTickets,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public getTicketsByBooking = catchAsyncNext(async (req, next: NextFunction, bookingId: number) => {
    const includeOptions = [
      {
        model: BookTicket,
        as: 'booking',
      },
    ];
    const features = new APIFeatures(Ticket, req.query as unknown as Record<string, string>, {
      include: includeOptions,
      where: { bookingId },
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await Ticket.count({
      where: { bookingId },
      include: includeOptions,
    });
    const allTickets = await features.execute();
    if (!allTickets) return next(new AppError(errorMessage('error.emptyTicket'), 404));

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = allTickets.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: allTickets,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public getAllTicketsByUser = catchAsyncNext(async (req: CustomRequest, next: NextFunction, userId: number) => {
    const queryOptions = {
      include: [
        {
          model: BookTicket,
          as: 'booking',
          required: true,
          where: { userId },
          include: [
            {
              model: Event,
              as: 'event',
              required: true,
              include: [
                { model: EventType, as: 'eventTypeRelation' },
                { model: Province, as: 'provinceRelation' },
              ],
            },
          ],
        },
      ],
    };
    const features = new APIFeatures(Ticket, req.query as unknown as Record<string, string>, queryOptions)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await Ticket.count(queryOptions);
    const allTickets = await features.execute();
    if (!allTickets) return next(new AppError(errorMessage('error.emptyTicket'), 404));

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = allTickets.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: allTickets,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public scanTicket = catchAsyncNext(async (req: CustomRequest, next: NextFunction, { ticketId, eventId }) => {
    const scannerUserId = Number(req.scannerUserFromRequest?.id);
    const supervisorId = Number(req.supervisorFromReq?.id);

    const transaction = await this.sequelize.transaction();

    const ticket = await Ticket.findOne({
      where: { id: ticketId },
      include: [
        {
          model: BookTicket,
          as: 'booking',
          include: [
            {
              model: Event,
              as: 'event',
            },
          ],
        },
      ],
      raw: false,
    });
    transaction;

    if (!ticket) {
      await transaction.rollback();
      return next(new AppError('Ticket not found', 404));
    }

    let canScan: any = '';

    if (ticket.get({ plain: true }).booking.event.id !== eventId)
      return next(new AppError('cannot scan this ticket', 400));

    if (scannerUserId) canScan = await this.scannerUserService.canScanEvent(scannerUserId, eventId, 'scan');
    if (supervisorId) canScan = await this.scannerUserService.canScanEvent(supervisorId, eventId, 'supervisor');

    if (!canScan) {
      await transaction.rollback();
      return next(new AppError('Not authorized to scan tickets for this event', 403));
    }

    if (!ticket.isValid) {
      await transaction.rollback();
      return next(new AppError('Ticket is not valid', 400));
    }

    if (ticket.isSuspended) {
      await transaction.rollback();
      return next(new AppError('Ticket is suspended', 400));
    }

    if (ticket.scanCounter >= ticket.scans) {
      await transaction.rollback();
      return next(new AppError('Maximum scans reached for this ticket', 400));
    }

    const updatedTicket = await ticket.update(
      {
        scanCounter: ticket.scanCounter + 1,
      },
      { transaction },
    );

    await transaction.commit();

    return updatedTicket;
  });

  public cancelTicket = catchAsyncService(async (data: { bookingId: number; transaction: Transaction }, next) => {
    const { bookingId, transaction } = data;
    const tickets = await Ticket.update({ isValid: false }, { where: { bookingId }, transaction });
    return tickets;
  });

  public suspendTicket = catchAsyncService(async (id: number, next: NextFunction) => {
    const transaction = await sequelize.transaction();
    await validateForeignKey(Ticket, id, 'Ticket');

    const suspendedTicket = await Ticket.findByPk(id, {
      transaction,
    });
    if (!suspendedTicket) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.eventNotFound'), 400));
    }
    if (!suspendedTicket.isValid) return next(new AppError(errorMessage('error.ticketAlreadyInvalid'), 400));
    else suspendedTicket.isSuspended = !suspendedTicket.isSuspended;

    await suspendedTicket.save();
    transaction.commit();
    return suspendedTicket;
  });

  public getTicketsReportForSupervisor = async (eventId: number, supervisorId: number) => {
    const eventFilter = !isNaN(eventId) ? { eventId } : {};

    const ticketsData = await Ticket.findAll({
      // logging: console.log,
      attributes: [
        [fn('DATE', col('"Ticket"."createdAt"')), 'date'],
        [col('booking.event."eventName"'), 'eventName'],
        [col('booking."ticketOption"'), 'ticketType'],
        [fn('COUNT', col('"Ticket"."id"')), 'totalTickets'],
      ],
      include: [
        {
          model: BookTicket,
          as: 'booking',
          required: true,
          where: eventFilter,
          include: [
            {
              model: Event,
              as: 'event',
              required: true,
              where: { supervisorId },
              // include: [
              //   { model: EventType, as: 'eventTypeRelation' },
              //   { model: Province, as: 'provinceRelation' },
              // ],
              attributes: [],
            },
          ],
          attributes: [],
        },
      ],
      group: [fn('DATE', col('"Ticket"."createdAt"')), col('booking.event.eventName'), col('booking.ticketOption')],
      order: [[fn('DATE', col('"Ticket"."createdAt"')), 'ASC']],
      raw: true,
    });

    return ticketsData;
  };

  public getTicketsCountTodayForDashboardMainPage = async () => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const ticketsCount = await Ticket.count({
      where: {
        createdAt: {
          [Op.gte]: startOfToday,
        },
      },
    });

    return ticketsCount;
  };
}

export default new TicketService(sequelize);
