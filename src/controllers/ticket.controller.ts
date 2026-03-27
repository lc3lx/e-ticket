import { Request, Response, NextFunction } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import ticketService, { TicketService } from '../services/ticket.service.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { errorMessage } from '../modules/i18next.config';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response.js';

class TicketController {
  private ticketService: TicketService;

  constructor(ticketService: TicketService) {
    this.ticketService = ticketService;
  }

  public getAllBooking = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const allTickets = await this.ticketService.getAllTickets(req, next);

    if (!allTickets) return next(new AppError(errorMessage('error.emptyTicket'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { allTickets },
    };
    res.status(200).json(successResponse);
  });

  public getTicketsByBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const bookingId = parseInt(req.params.bookingId, 10);
    const tickets = await this.ticketService.getTicketsByBooking(req, next, bookingId);

    if (!tickets) return next(new AppError(errorMessage('error.emptyTicket'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { tickets },
    };
    res.status(200).json(successResponse);
  });

  public getAllTicketsForUser = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = Number(req.normalUserFromReq?.id);
    const tickets = await this.ticketService.getAllTicketsByUser(req, next, userId);

    if (!tickets) return next(new AppError(errorMessage('error.emptyTicket'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { tickets },
    };
    res.status(200).json(successResponse);
  });

  public scanerTicket = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const ticketId = Number(req.params.ticketId);
    const eventId = Number(req.params.eventId);
    if (!ticketId) return next(new AppError('missing ticketId', 400));
    if (!eventId) return next(new AppError('missing eventId', 400));
    const scan = await this.ticketService.scanTicket(req, next, { ticketId, eventId });

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { scan },
    };
    res.status(200).json(successResponse);
  });

  public suspendTicketsByBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const ticketId = parseInt(req.params.ticketId, 10);
    const ticket = await this.ticketService.suspendTicket(ticketId, next);

    if (!ticket) return next(new AppError(errorMessage('error.ticketNotFound'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { ticket },
    };
    res.status(200).json(successResponse);
  });
}

export default new TicketController(ticketService);
