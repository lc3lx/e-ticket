import { NextFunction, Response } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import { CreateEventDTO } from '../interfaces/event/createEvent.dto';
import { SuggestEventTypeDTO } from '../interfaces/event/suggestedEventRequest.dto';
import eventService, { EventService } from '../services/event.service';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response';
import { errorMessage } from '../modules/i18next.config';

class EventController {
  private eventService: EventService;

  constructor(eventService: EventService) {
    this.eventService = eventService;
  }

  public getAllEvents = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const allEvents = await this.eventService.getAllEvents(req, next);
    if (!allEvents) return next(new AppError(errorMessage('error.eventsNotFound'), 404));
    const eventSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { allEvents },
    };
    res.status(200).json(eventSuccessResponse);
  });

  public getAllEventsForSupervisor = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const allEvents = await this.eventService.getAllEventsForSupervisor(req, next);
    if (!allEvents) return next(new AppError(errorMessage('error.eventsNotFound'), 404));
    const eventSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { allEvents },
    };
    res.status(200).json(eventSuccessResponse);
  });

  public getAllEventsForAdmin = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const allEvents = await this.eventService.getAllEventsForAdmin(req, next);
    if (!allEvents) return next(new AppError(errorMessage('error.eventsNotFound'), 404));
    const eventSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { allEvents },
    };
    res.status(200).json(eventSuccessResponse);
  });

  public getAllPendingUpdateEventsForAdmin = catchAsync(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
      const allPendingEvents = await this.eventService.getAllPendingUpdateEventsForAdmin(req, next);
      if (!allPendingEvents) return next(new AppError('there is no Pending Events', 404));
      const eventSuccessResponse: DefaultSuccessResponse = {
        ...defaultSuccessResponse(),
        data: { allPendingEvents },
      };
      res.status(200).json(eventSuccessResponse);
    },
  );

  public getAllPendingApproveEventsForAdmin = catchAsync(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
      const allPendingEvents = await this.eventService.getAllPendingApproveEventsForAdmin(req, next);
      if (!allPendingEvents) return next(new AppError('there is no Pending Events', 404));
      const eventSuccessResponse: DefaultSuccessResponse = {
        ...defaultSuccessResponse(),
        data: { allPendingEvents },
      };
      res.status(200).json(eventSuccessResponse);
    },
  );

  public getOneEvent = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const event = await this.eventService.getOneEvent(Number(req.params.id), next);
    if (!event) return next(new AppError(errorMessage('error.eventNotFound'), 404));
    const eventSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { event },
    };
    res.status(200).json(eventSuccessResponse);
  });

  public getOneEventForAdmin = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const event = await this.eventService.getOneEventForAdminService(Number(req.params.id), next);
    if (!event) return next(new AppError(errorMessage('error.eventNotFound'), 404));
    const eventSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { event },
    };
    res.status(200).json(eventSuccessResponse);
  });

  public getOnePendingUpdateEventForAdmin = catchAsync(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
      const pendingEvent = await this.eventService.getOnePendingUpdateEventForAdmin(Number(req.params.id), next);
      if (!pendingEvent) return next(new AppError(errorMessage('error.eventNotFound'), 404));
      const eventSuccessResponse: DefaultSuccessResponse = {
        ...defaultSuccessResponse(),
        data: { pendingEvent },
      };
      res.status(200).json(eventSuccessResponse);
    },
  );

  public createNewEvent = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.files) return next(new AppError(errorMessage('error.eventMainPhotoMissing'), 400));

    const ticketOptionsAndPrices = JSON.parse(req.body.ticketOptionsAndPrices);
    let supervisorId;
    if (req.originalUrl.split('/').includes('admin')) supervisorId = req.body?.supervisorId;
    else supervisorId = req.supervisorFromReq?.id;
    if (!supervisorId) return next(new AppError('cannot fine supervisor in the context', 400));

    const data: CreateEventDTO = {
      ...req.body,
      ticketOptionsAndPrices,
      supervisorId,
    };
    let newEvent;
    if (req.originalUrl.split('/').includes('admin'))
      newEvent = await this.eventService.createEventFromAdmin(data, next);
    else newEvent = await this.eventService.createEvent(data, next);

    if (!newEvent) return next(new AppError('cannot create this event', 400));
    const eventSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { newEvent },
    };
    res.status(201).json(eventSuccessResponse);
  });

  public approveEventByAdmin = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const data = { id: Number(req.params.id), profit: Number(req.body.profit) };
    const approvedEvent = await this.eventService.ApproveEvent(data, next);
    if (!approvedEvent) return next(new AppError(errorMessage('error.eventNotFound'), 404));
    const eventSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { approvedEvent },
    };
    res.status(201).json(eventSuccessResponse);
  });

  public declineEventByAdmin = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const declinedEvent = await this.eventService.declineEvent(Number(req.params.id), next);
    if (!declinedEvent) return next(new AppError(errorMessage('error.eventNotFound'), 404));
    const eventSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { declinedEvent },
    };
    res.status(201).json(eventSuccessResponse);
  });

  public suspendEventByAdmin = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const suspendedEvent = await this.eventService.suspendEvent(Number(req.params.id), next);
    if (!suspendedEvent) return next(new AppError(errorMessage('error.eventNotFound'), 404));
    const eventSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { suspendedEvent },
    };
    res.status(200).json(eventSuccessResponse);
  });

  public uploadImagesForEvent = eventService.uploadEventImages;

  public processEventPhotos = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.files) next();
    if (!req.params.id) {
      await this.eventService.saveEventImagesOnCreate(req, next);
    } else {
      await this.eventService.saveEventImagesOnUpdate(req, next);
    }
    next();
  });

  public updateEvent = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.supervisorFromReq) return next(new AppError('User not found in request context', 401));
    const supervisorId = req.supervisorFromReq.id;
    if (!supervisorId) return next(new AppError('Please specify the supervisor', 401));
    const { id } = req.params;
    const data = { ...req.body, id, supervisorId };
    if (req.body.ticketOptionsAndPrices)
      Object.assign(data, { ticketOptionsAndPrices: JSON.parse(req.body.ticketOptionsAndPrices) });
    const updatedEvent = await this.eventService.updateEventService(data, next);

    if (!updatedEvent) return next(new AppError('Some thing goes wrong while updating Event', 404));

    const eventSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { updatedEvent },
    };
    res.status(200).json(eventSuccessResponse);
  });

  public approveUpdateEvent = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    // const { id } = req.params;
    const data = { id: Number(req.params.id), profit: Number(req.body.profit) };
    const approvedEvent = await this.eventService.ApproveUpdateEvent(data, next);

    // if (!approvedEvent) return next(new AppError('Some thing goes wrong while approve update Event', 404));
    if (!approvedEvent) return;

    const eventSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { approvedEvent },
    };
    res.status(200).json(eventSuccessResponse);
  });

  public declineUpdateEvent = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const approvedEvent = await this.eventService.declineUpdateEvent(Number(id), next);

    // if (!approvedEvent) return next(new AppError('Some thing goes wrong while approve update Event', 404));
    if (!approvedEvent) return;

    const eventSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { approvedEvent },
    };
    res.status(200).json(eventSuccessResponse);
  });

  public updateEventForAdmin = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.adminFromReq) return next(new AppError('User not found in request context', 401));

    let ticketOptionsAndPrices = '';
    const { id } = req.params;
    let data = { ...req.body, id };
    if (req.body.ticketOptionsAndPrices) {
      ticketOptionsAndPrices = JSON.parse(req.body.ticketOptionsAndPrices);
      data = { ...data, ticketOptionsAndPrices };
    }
    const updatedEvent = await this.eventService.updateEventForAdminService(data, next);

    if (!updatedEvent) return;

    const eventSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { updatedEvent },
    };
    res.status(200).json(eventSuccessResponse);
  });

  public hideEvent = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const hidedEvent = await this.eventService.hideEventService(Number(req.params.eventId), next);
    if (!hidedEvent) return next(new AppError('Event Not found to hide', 404));
    const eventSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { hidedEvent },
    };
    res.status(200).json(eventSuccessResponse);
  });

  public deleteEvent = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    let deletedEvent;
    if (req.originalUrl.split('/').includes('admin'))
      deletedEvent = await this.eventService.deleteEventServiceForAdmin(Number(req.params.eventId), next);
    else {
      const supervisorId = req.supervisorFromReq?.id;
      if (!supervisorId) return next(new AppError('cannot found supervisor to delete his event', 404));
      const eventId = Number(req.params.eventId);
      deletedEvent = await this.eventService.deleteEventService({ supervisorId, eventId }, next);
    }
    if (!deletedEvent) return next(new AppError('cannot find the event to delete it', 404));
    const eventSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
    };
    res.status(204).json(eventSuccessResponse);
  });

  public getTop10Events = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.normalUserFromReq) return next(new AppError('User not found in request context', 401));

    const topEvents = await this.eventService.getTop10Events(next);

    if (!topEvents) return next(new AppError('Some thing goes wrong while getting top 10 Events', 404));

    const eventSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { topEvents },
    };
    res.status(200).json(eventSuccessResponse);
  });

  public suggestedEvents = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.normalUserFromReq) return next(new AppError('User not found in request context', 401));
    const userProvinces = req.normalUserFromReq.provinces?.map((el) => el.id);
    const userEventTypes = req.normalUserFromReq.eventTypes?.map((el) => el.id);
    const data: SuggestEventTypeDTO = { userProvinces, userEventTypes };

    const suggestedEvents = await this.eventService.suggestedEvents(data, next);

    if (!suggestedEvents) return next(new AppError('Some thing goes wrong while getting top suggested Events', 404));

    const eventSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { suggestedEvents },
    };
    res.status(200).json(eventSuccessResponse);
  });

  public getRateAppNotification = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const supervisorId = Number(req.supervisorFromReq?.id);
    const isAccepted = req.normalUserFromReq?.acceptRateAppNotification!;
    if (!supervisorId) return next(new AppError(errorMessage('error.Missing supervisor id'), 400));

    const notificationStatus = await this.eventService.getRateAppNotification({ supervisorId, isAccepted }, next);
    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { notificationStatus, isAccepted },
    };
    res.status(200).json(successResponse);
  });
}

export default new EventController(eventService);
