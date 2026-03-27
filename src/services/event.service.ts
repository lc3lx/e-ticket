import cron from 'node-cron';
import { NextFunction, Request } from 'express';
import path from 'path';
import { Sequelize, QueryTypes, Transaction, Op } from 'sequelize';
import pathName from '../utils/serverAndPort.js';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import Event, { CustomUpdateOptions, EventCreationAttributes } from '../models/event.model';
import PendingEvent, {
  CustomUpdateOptionsPendingEvent,
  PendingEventCreationAttributes,
} from '../models/eventPending.model';
import EventType from '../models/eventType.model';
import Province from '../models/provinces.model';
import { Supervisor } from '../models/supervisor.model';
import SupervisorRequest from '../models/supervisorRequest.model.js';
import { CreateEventDTO } from '../interfaces/event/createEvent.dto';
import { UpdateEventDTO } from '../interfaces/event/updateEvent.dto';
import { DeleteEventTypeDTO } from '../interfaces/event/deleteEvent.dto.js';
import { SuggestEventTypeDTO } from '../interfaces/event/suggestedEventRequest.dto';
import AppError from '../utils/AppError.js';
import catchAsyncService from '../utils/catchAsyncService.js';
import catchAsyncNext from '../utils/catchAsyncNextOnly.js';
import catchAsyncReqNext from '../utils/catchAsyncReqNext.js';
import upload from '../modules/multer.config';
import APIFeatures from '../utils/apiFeatures.js';
import { errorMessage, commonMessage } from '../modules/i18next.config';
import EventStatus from '../common/enums/eventStatus.enum.js';
import { createEventSchema } from '../modules/zodValidation/event/createEvent.config.js';
import { PushNotificationService } from './push.service.js';
import { sequelize } from '../DB/sequelize.js';
import NotificationTypes from '../common/enums/notificationTypes.enum';
import bookTicketService from './bookTicket.service.js';
import User from '../models/user.model.js';
import RateEvent from '../models/rateEvent.model.js';
import { normalizeToYMD } from '../modules/zodValidation/globalConfig.schema.js';
import { validateRelativeEventDates } from '../utils/eventSeviceValidation.js';
import { updateEventSchema } from '../modules/zodValidation/event/updateEvent.config.js';

interface EventStatusCount {
  [status: string]: number;
}

export class EventService {
  private sequelize: Sequelize;

  private lastImmediateRun: Date | null = null;

  private cronScheduled: boolean = false;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
    this.initializeDbJobs().catch((error) => console.error('Failed to initialize jobs:', error.message));
    this.scheduleNodeCornForRateEventsAfterEnding();
  }

  private async initializeDbJobs() {
    await this.eventTimerProcedure();
    await this.runImmediateTimer();
    await this.setupScheduler();
  }

  public getAllEvents = catchAsyncReqNext(async (req: Request, next: NextFunction) => {
    const includeOptions = [
      { model: EventType, as: 'eventTypeRelation' },
      { model: Province, as: 'provinceRelation' },
      {
        model: Supervisor,
        as: 'supervisor',
        required: false,
        where: {
          blocked: false,
          deletedAt: null,
          deactivated: false,
        },
        include: [
          {
            model: User,
            as: 'user',
          },
        ],
      },
    ];
    // const transaction = await this.sequelize.transaction();
    const features = new APIFeatures(Event, req.query as unknown as Record<string, string>, {
      include: includeOptions,
      // transaction,
    })
      .filter()
      .search()
      //TODO: here
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await Event.count({
      where: features.query.where,
      include: includeOptions,
      // transaction,
    });

    const allEvents = await features.execute();

    if (!allEvents) {
      // await transaction.rollback();
      return next(new AppError(errorMessage('error.eventsNotFound'), 404));
    }

    // await transaction.commit();
    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = allEvents.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;
    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: allEvents,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public getAllEventsForSupervisor = catchAsyncReqNext(
    async (req: CustomRequest, next: NextFunction, supervisorIdFromScanner: number) => {
      const includeOptions = [
        { model: EventType, as: 'eventTypeRelation' },
        { model: Province, as: 'provinceRelation' },
      ];
      const supervisorId = req.supervisorFromReq?.id || supervisorIdFromScanner;
      const transaction = await this.sequelize.transaction();
      const features = new APIFeatures(Event, req.query as unknown as Record<string, string>, {
        include: includeOptions,
        transaction,
        where: { supervisorId },
      })
        .filter()
        .sort()
        .limitFields()
        .paginate();

      const totalCount = await Event.count({
        where: features.options.where,
        include: includeOptions,
        distinct: true,
        transaction,
      });

      const allEvents = await features.execute(transaction);

      if (!allEvents) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.eventsNotFound'), 404));
      }

      await transaction.commit();
      const totalPages = Math.ceil(totalCount / features.limit);
      const totalItemsInPage = allEvents.length;
      const hasPreviousPage = features.page > 1;
      const hasNextPage = features.page < totalPages;

      return {
        page: features.page,
        totalPages,
        totalItemsInPage,
        limit: features.limit,
        totalCount,
        data: allEvents,
        hasPreviousPage,
        hasNextPage,
      };
    },
  );

  public getAllEventsForAdmin = catchAsyncReqNext(async (req: Request, next: NextFunction) => {
    const includeOptions = [
      { model: EventType, as: 'eventTypeRelation' },
      { model: Province, as: 'provinceRelation' },
      { model: Supervisor, as: 'supervisor', include: [{ model: User, as: 'user' }], paranoid: false },
    ];
    // const transaction = await this.sequelize.transaction();
    const features = new APIFeatures(Event.scope('withHidden'), req.query as unknown as Record<string, string>, {
      include: includeOptions,
      // transaction,
    })
      .filter()
      .search()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await Event.scope('withHidden').count({
      where: features.query.where,
      include: includeOptions,
      // transaction,
    });
    const allEvents = await features.execute();
    if (!allEvents) {
      // await transaction.rollback();
      return next(new AppError(errorMessage('error.eventsNotFound'), 404));
    }

    // await transaction.commit();
    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = allEvents.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: allEvents,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public getAllPendingUpdateEventsForAdmin = catchAsyncReqNext(async (req: Request, next: NextFunction) => {
    const includeOptions = [
      { model: EventType, as: 'eventTypeRelation' },
      { model: Province, as: 'provinceRelation' },
      { model: Supervisor, as: 'supervisor', include: [{ model: User, as: 'user' }] },
    ];
    const transaction = await this.sequelize.transaction();
    const features = new APIFeatures(PendingEvent.scope('withAll'), req.query as unknown as Record<string, string>, {
      include: includeOptions,
      transaction,
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await PendingEvent.scope('withAll').count({
      where: features.query.where,
      include: includeOptions,
      transaction,
    });
    const allPendingEvents = await features.execute(transaction);
    if (!allPendingEvents) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.eventsNotFound'), 404));
    }

    await transaction.commit();
    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = allPendingEvents.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: allPendingEvents,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public getAllPendingApproveEventsForAdmin = catchAsyncReqNext(async (req: Request, next: NextFunction) => {
    const includeOptions = [
      { model: EventType, as: 'eventTypeRelation' },
      { model: Province, as: 'provinceRelation' },
      { model: Supervisor, as: 'supervisor', include: [{ model: User, as: 'user' }] },
    ];
    const transaction = await this.sequelize.transaction();
    const features = new APIFeatures(Event.scope('onlyNotAccepted'), req.query as unknown as Record<string, string>, {
      include: includeOptions,
      transaction,
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await Event.scope('onlyNotAccepted').count({
      where: features.query.where,
      include: includeOptions,
      transaction,
    });
    const allPendingEvents = await features.execute(transaction);
    if (!allPendingEvents) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.eventsNotFound'), 404));
    }
    await transaction.commit();
    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = allPendingEvents.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: allPendingEvents,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public getOneEvent = catchAsyncService(async (id: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const event = await Event.findByPk(id, {
      include: [
        { model: EventType, as: 'eventTypeRelation' },
        { model: Province, as: 'provinceRelation' },
        { model: Supervisor, as: 'supervisor' },
      ],
      transaction,
    });
    if (!event) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.eventNotFound'), 404));
    }
    await event.increment('visitCount', { transaction });
    await transaction.commit();
    return event;
  });

  public getOneEventForAdminService = catchAsyncService(async (id: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const event = await Event.scope('withHidden').findByPk(id, {
      include: [
        { model: EventType, as: 'eventTypeRelation' },
        { model: Province, as: 'provinceRelation' },
        { model: Supervisor, as: 'supervisor' },
      ],
      transaction,
    });
    if (!event) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.eventNotFound'), 404));
    }
    await transaction.commit();
    return event;
  });

  public getOnePendingUpdateEventForAdmin = catchAsyncService(async (id: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const pendingEvent = await PendingEvent.scope('withAll').findByPk(id, {
      include: [
        { model: EventType, as: 'eventTypeRelation' },
        { model: Province, as: 'provinceRelation' },
        { model: Supervisor, as: 'supervisor', include: [{ model: User, as: 'user' }] },
        { model: Event, as: 'originalEvent' },
      ],
      transaction,
    });
    if (!pendingEvent) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.eventNotFound'), 404));
    }
    await transaction.commit();
    return pendingEvent;
  });

  public createEvent = catchAsyncService(async (data: CreateEventDTO, next: NextFunction) => {
    const { supervisorId, ...restData } = data;

    const parsedData = await createEventSchema.safeParseAsync(restData);
    if (!parsedData.success) {
      return next(parsedData.error);
    }

    const transaction = await this.sequelize.transaction();
    const events = await Event.scope('withHidden').findAll({
      where: { supervisorId: data.supervisorId },
      transaction,
    });
    const existEvent = events.find(
      (event) =>
        event.slug === data.eventName.split(' ').join('-').toLowerCase() &&
        event.startEventDate === data.startEventDate,
    );
    if (existEvent) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.eventExist'), 400));
    }
    const createdEvent = await Event.create(data, { transaction });
    const returnedEvent = await Event.scope('onlyNotAccepted').findByPk(createdEvent.id, {
      include: [
        { model: EventType, as: 'eventTypeRelation' },
        { model: Province, as: 'provinceRelation' },
        { model: Supervisor, as: 'supervisor' },
      ],
      transaction,
    });
    if (!returnedEvent) {
      await transaction.rollback();
      return next(new AppError('Cannot create this event', 400));
    }

    const supervisorRequest = await SupervisorRequest.create(
      {
        requestTargetId: returnedEvent.id,
        requestType: 'eventCreate',
        supervisorId: data.supervisorId,
      },
      { transaction, validate: true },
    );

    if (!supervisorRequest) {
      await transaction.rollback();
      return next(new AppError('Cannot create request for this event', 400));
    }
    await transaction.commit();
    const eventData = returnedEvent.toJSON();
    return { ...eventData, supervisorRequest: supervisorRequest.dataValues.id };
  });

  public createEventFromAdmin = catchAsyncService(async (data: CreateEventDTO, next: NextFunction) => {
    const { supervisorId, ...restData } = data;
    const parsedData = await createEventSchema.safeParseAsync(restData);
    if (!parsedData.success) {
      return next(parsedData.error);
    }

    const transaction = await this.sequelize.transaction();
    const events = await Event.findAll({
      where: { supervisorId: data.supervisorId },
      transaction,
    });
    const existEvent = events.find(
      (event) =>
        event.slug === data.eventName.split(' ').join('-').toLowerCase() &&
        event.startEventDate === data.startEventDate,
    );
    if (existEvent) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.eventApprovedBefore'), 400));
    }
    const createdEvent = await Event.create(
      { ...data, isApproved: true, hasSentRateReminder: false },
      { transaction, validate: true },
    );
    const returnedEvent = await Event.scope('withNotAccepted').findByPk(createdEvent.id, {
      include: [
        { model: EventType, as: 'eventTypeRelation' },
        { model: Province, as: 'provinceRelation' },
        { model: Supervisor, as: 'supervisor' },
      ],
      transaction,
    });
    if (!returnedEvent) {
      await transaction.rollback();
      return next(new AppError('Cannot create this event', 400));
    }
    await transaction.commit();
    return returnedEvent;
  });

  public ApproveEvent = catchAsyncService(async (data: { id: number; profit: number }, next: NextFunction) => {
    // if(!)
    const transaction = await this.sequelize.transaction();
    const event = await Event.scope('onlyNotAccepted').findByPk(data.id, {
      include: [
        { model: EventType, as: 'eventTypeRelation' },
        { model: Province, as: 'provinceRelation' },
        { model: Supervisor, as: 'supervisor' },
      ],
      transaction,
    });
    if (!event) {
      await transaction.rollback();
      return next(new AppError('cannot find this event to approve it', 400));
    }
    if (!data.profit) data.profit = 0;
    event.isApproved = true;
    event.profit = data.profit;
    await event.save({ skipPreHooks: true, transaction } as CustomUpdateOptions);
    await transaction.commit();

    const userType = 'supervisor';

    const notificationPayload = {
      title: commonMessage('common.approveEventTitle'),
      body: commonMessage('common.approveEventBody'),
      data: {
        eventId: String(event.id),
        eventName: event.eventName,
        userType,
        userId: String(event.supervisor.userId),
        type: NotificationTypes.APPROVEEVENT,
        uniqueValue: event.supervisor.username,
      },
      type: NotificationTypes.APPROVEEVENT,
    };
    PushNotificationService.sendToUser(event.supervisor.userId, notificationPayload, userType);
    return event;
  });

  public declineEvent = catchAsyncService(async (id: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const decliendEvent = await Event.scope('onlyNotAccepted').findByPk(id, {
      include: [
        { model: EventType, as: 'eventTypeRelation' },
        { model: Province, as: 'provinceRelation' },
        { model: Supervisor, as: 'supervisor' },
      ],
      transaction,
    });
    if (!decliendEvent) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.eventNotFound'), 400));
    }
    decliendEvent.isDeclined = true;
    await decliendEvent.save({ skipPreHooks: true } as CustomUpdateOptions);
    transaction.commit();

    const userType = 'supervisor';

    const notificationPayload = {
      title: commonMessage('common.declineEventTitle'),
      body: commonMessage('common.declineEventBody'),
      data: {
        eventId: String(decliendEvent.id),
        eventName: decliendEvent.eventName,
        userType,
        userId: String(decliendEvent.supervisor.userId),
        type: NotificationTypes.DECLINEEVENT,
        uniqueValue: decliendEvent.supervisor.username,
      },
      type: NotificationTypes.DECLINEEVENT,
    };
    PushNotificationService.sendToUser(decliendEvent.supervisor.userId, notificationPayload, userType);
    return decliendEvent;
  });

  public suspendEvent = catchAsyncService(async (id: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();

    const suspendedEvent = await Event.scope('withHidden').findByPk(id, {
      include: [
        { model: EventType, as: 'eventTypeRelation' },
        { model: Province, as: 'provinceRelation' },
        { model: Supervisor, as: 'supervisor' },
      ],
      transaction,
    });
    if (!suspendedEvent) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.eventNotFound'), 400));
    }
    if (suspendedEvent.eventStatus === EventStatus.ENDED)
      return next(new AppError(errorMessage('error.eventEndAlready'), 400));
    if (suspendedEvent.eventStatus === EventStatus.CANCELEDBYSYSTEMADMIN) {
      suspendedEvent.availableTickets === 0
        ? (suspendedEvent.eventStatus = EventStatus.SOLDOUT)
        : (suspendedEvent.eventStatus = EventStatus.AVAILABLE);
    } else if (suspendedEvent.eventStatus === EventStatus.AVAILABLE)
      suspendedEvent.eventStatus = EventStatus.CANCELEDBYSYSTEMADMIN;
    await suspendedEvent.save({ skipPreHooks: true } as CustomUpdateOptions);
    transaction.commit();

    const userType = 'supervisor';

    let notificationPayload;
    suspendedEvent.eventStatus === EventStatus.CANCELEDBYSYSTEMADMIN
      ? (notificationPayload = {
          title: commonMessage('common.suspendEventTitle'),
          body: commonMessage('common.suspendEventBody'),
          data: {
            eventId: String(suspendedEvent.id),
            eventName: suspendedEvent.eventName,
            userType,
            userId: String(suspendedEvent.supervisorId),
            type: NotificationTypes.SUSPENDEVENT,
            uniqueValue: suspendedEvent.supervisor.username,
          },
          type: NotificationTypes.SUSPENDEVENT,
        })
      : (notificationPayload = {
          title: commonMessage('common.unSuspendEventTitle'),
          body: commonMessage('common.unSuspendEventBody'),
          data: {
            eventId: String(suspendedEvent.id),
            eventName: suspendedEvent.eventName,
            userType,
            userId: String(suspendedEvent.supervisor.userId),
            type: NotificationTypes.UNSUSPENDEVENT,
            uniqueValue: suspendedEvent.supervisor.username,
          },
          type: NotificationTypes.UNSUSPENDEVENT,
        });
    PushNotificationService.sendToUser(suspendedEvent.supervisor.userId, notificationPayload, userType);
    return suspendedEvent;
  });

  public uploadEventImages = upload.fields([
    { name: 'mainPhoto', maxCount: 1 },
    { name: 'miniPoster', maxCount: 1 },
    { name: 'eventPhotos', maxCount: 10 },
  ]);

  public saveEventImagesOnUpdate = catchAsyncReqNext(async (req: CustomRequest, next: NextFunction) => {
    const { mainPhoto, miniPoster, eventPhotos } = req.body;

    const eventId = Number(req.params.id);
    if (!eventId) return next(new AppError(errorMessage('error.eventNotFound'), 404));

    const event = await Event.unscoped().findByPk(eventId);
    if (!event) return next(new AppError(errorMessage('error.eventNotFound'), 404));

    if (mainPhoto) req.body.mainPhoto = this.generateFilePath(mainPhoto, 'mainPhoto');
    if (miniPoster) req.body.miniPoster = this.generateFilePath(miniPoster, 'miniPoster');
    if (eventPhotos === '') req.body.eventPhotos = [];
    if (eventPhotos && Array.isArray(eventPhotos)) {
      req.body.eventPhotos = eventPhotos.map((photo) => this.generateFilePath(photo, 'eventPhotos'));
    }
  });

  public saveEventImagesOnCreate = catchAsyncReqNext(async (req: CustomRequest, next: NextFunction) => {
    const { mainPhoto, miniPoster, eventPhotos } = req.body;
    if (!mainPhoto || !miniPoster) return next(new AppError(errorMessage('error.eventMainPhotoMissing'), 400));

    if (mainPhoto) req.body.mainPhoto = this.generateFilePath(mainPhoto, 'mainPhoto');
    if (miniPoster) req.body.miniPoster = this.generateFilePath(miniPoster, 'miniPoster');
    if (eventPhotos && Array.isArray(eventPhotos)) {
      req.body.eventPhotos = eventPhotos.map((photo) => this.generateFilePath(photo, 'eventPhotos'));
    }
  });

  public updateEventForAdminService = catchAsyncService(async (data: UpdateEventDTO, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    try {
      const event = await Event.unscoped().findByPk(data.id, { transaction });
      if (!event) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.eventNotFound'), 404));
      }

      const newEventData = {
        ...event.get({ plain: true }),
        ...data,
        supervisorId: event.supervisorId,
      } as Partial<EventCreationAttributes> & { supervisorId: number; eventId: number };

      const {
        id,
        hasSentRateReminder,
        supervisorId,
        slug,
        availableTickets,
        eventStatus,
        visitCount,
        isApproved,
        isDeclined,
        isVisible,
        // @ts-ignore
        createdAt,
        // @ts-ignore
        updatedAt,
        // @ts-ignore
        deletedAt,
        ...restData
      } = newEventData;

      const parsedData = await createEventSchema.safeParseAsync(restData);
      if (!parsedData.success) {
        return next(parsedData.error);
      }

      const updatedEvent = await event.update(newEventData, {
        // skipPreHooks: true,
        transaction,
        validate: true,
      } as CustomUpdateOptions);

      await updatedEvent.reload({ transaction });
      await transaction.commit();
      return updatedEvent;
    } catch (error: any) {
      if (transaction) await transaction.rollback();
      return next(error);
    }
  });

  public updateEventService = catchAsyncService(async (data: UpdateEventDTO, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const event = await Event.findByPk(data.id, {
      transaction,
    });
    if (!event) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.eventNotFound'), 404));
    }
    if (event.supervisorId && event.supervisorId !== data.supervisorId)
      return next(new AppError(errorMessage('error.this event is not for this supervisor'), 404));

    const effectiveStartEventDate = data.startEventDate ?? event.startEventDate;
    const effectiveEndEventDate = data.endEventDate ?? event.endEventDate;
    const effectiveStartApplyDate = data.startApplyDate ?? event.startApplyDate;
    const effectiveEndApplyDate = data.endApplyDate ?? event.endApplyDate;

    const effectiveStartEventHour = data.startEventHour ?? event.startEventHour;
    const effectiveEndEventHour = data.endEventHour ?? event.endEventHour;

    const pendingEvent = await PendingEvent.scope('onlyNotAccepted').findOne({
      where: { eventId: event.id },
      include: [
        { model: EventType, as: 'eventTypeRelation' },
        { model: Province, as: 'provinceRelation' },
        { model: Supervisor, as: 'supervisor' },
      ],
      transaction,
    });
    if (pendingEvent) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.UpdateEventHasPreviousRequest'), 400));
    }
    const newEventData = {
      // ...event.get({ plain: true }),
      ...data,
      slug: data.eventName?.split(' ').join('-').toLowerCase(),
      supervisorId: event.supervisorId,
      eventId: event.id,
      attendanceType: data.attendanceType ?? event.attendanceType,
      eventStatus: event.eventStatus,
    } as Partial<PendingEventCreationAttributes> & { supervisorId: number; eventId: number };
    delete newEventData.id;

    const {
      id,
      eventId,
      // @ts-ignore
      hasSentRateReminder,
      supervisorId,
      slug,
      eventStatus,
      visitCount,
      // @ts-ignore
      availableTickets,
      // @ts-ignore
      isApproved,
      // @ts-ignore
      isDeclined,
      // @ts-ignore
      isVisible,
      // @ts-ignore
      createdAt,
      // @ts-ignore
      updatedAt,
      // @ts-ignore
      deletedAt,
      ...restData
    } = newEventData;

    newEventData.profit = 0;

    const parsedData = await updateEventSchema.safeParseAsync(restData);
    if (!parsedData.success) {
      await transaction.rollback();
      return next(parsedData.error);
    }

    validateRelativeEventDates(
      effectiveStartEventDate,
      effectiveEndEventDate,
      effectiveStartEventHour,
      effectiveEndEventHour,
      effectiveStartApplyDate,
      effectiveEndApplyDate,
    );

    // const updatedEvent = await PendingEvent.create(
    //   { ...restData, eventId, supervisorId, eventStatus },
    //   { transaction, validate: true },
    // );

    const updatedEvent = await PendingEvent.create(
      {
        ...restData,
        startEventDate: effectiveStartEventDate,
        endEventDate: effectiveEndEventDate,
        startApplyDate: effectiveStartApplyDate,
        endApplyDate: effectiveEndApplyDate,
        startEventHour: effectiveStartEventHour,
        endEventHour: effectiveEndEventHour,
        eventId,
        supervisorId,
        eventStatus,
      },
      { transaction, validate: true },
    );

    if (!updatedEvent) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.cannotUpdateEvent'), 400));
    }

    const supervisorRequest = await SupervisorRequest.create(
      {
        requestTargetId: newEventData.eventId,
        requestType: 'eventUpdate',
        supervisorId: data.supervisorId,
      },
      { transaction, validate: true },
    );

    if (!supervisorRequest) {
      await transaction.rollback();
      return next(new AppError('Cannot create request for this event', 400));
    }
    await transaction.commit();
    const eventData = { ...updatedEvent };
    return { ...eventData, supervisorRequest: supervisorRequest.id };
  });

  public ApproveUpdateEvent = catchAsyncService(async (data: { id: number; profit: number }, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const event = await PendingEvent.findOne({
      where: { eventId: data.id, isUpdateApproved: false },
      include: [
        { model: EventType, as: 'eventTypeRelation' },
        { model: Province, as: 'provinceRelation' },
        { model: Supervisor, as: 'supervisor', include: [{ model: User, as: 'user' }] },
      ],
      transaction,
    });
    if (!event) {
      await transaction.rollback();
      return next(new AppError('cannot find this event to approve the update', 404));
    }
    event.isUpdateApproved = true;

    if (data.profit) event.profit = data.profit;
    await event.save({ skipPreHooks: true, transaction } as CustomUpdateOptionsPendingEvent);

    const updatedEvent = await Event.findByPk(event.eventId, {
      include: [
        { model: EventType, as: 'eventTypeRelation' },
        { model: Province, as: 'provinceRelation' },
        { model: Supervisor, as: 'supervisor' },
      ],
      transaction,
    });
    if (!updatedEvent) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.eventNotFound'), 404));
    }

    if (updatedEvent.visitCount || updatedEvent.visitCount === 0) event.visitCount = updatedEvent.visitCount;
    // console.log(event.get());
    // console.log(updatedEvent.get());

    const updatedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(event.get())) {
      if (value !== undefined && value !== null && key !== 'id' && key !== 'eventId') {
        updatedData[key] = value;
      }
    }

    await updatedEvent.update(updatedData, { skipPreHooks: true, transaction } as CustomUpdateOptions);
    if (event.seatsQty) updatedEvent.availableTickets = event.seatsQty;

    await updatedEvent.reload({ transaction });
    await transaction.commit();
    return updatedEvent;
  });

  public declineUpdateEvent = catchAsyncService(async (id: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const event = await PendingEvent.findOne({
      where: { eventId: id, isUpdateApproved: false, isUpdateDeclined: false },
      include: [
        { model: EventType, as: 'eventTypeRelation' },
        { model: Province, as: 'provinceRelation' },
        { model: Supervisor, as: 'supervisor' },
      ],
      transaction,
    });
    if (!event) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.eventNotFound'), 404));
    }
    event.isUpdateDeclined = true;
    await event.save({ skipPreHooks: true, transaction } as CustomUpdateOptionsPendingEvent);

    const updatedEvent = await Event.findByPk(event.eventId, {
      include: [
        { model: EventType, as: 'eventTypeRelation' },
        { model: Province, as: 'provinceRelation' },
        { model: Supervisor, as: 'supervisor' },
      ],
      transaction,
    });
    if (!updatedEvent) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.eventNotFound'), 404));
    }
    await transaction.commit();
    return updatedEvent;
  });

  public hideEventService = catchAsyncService(async (eventId: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const event = await Event.scope('withHidden').findByPk(eventId, { transaction });
    if (!event) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.eventNotFound'), 404));
    }
    event.isVisible = !event.isVisible;
    await event.save({ skipPreHooks: true, transaction } as CustomUpdateOptions);
    await transaction.commit();
    return event;
  });

  public deleteEventService = catchAsyncService(async (data: DeleteEventTypeDTO, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const event = await Event.findByPk(data.eventId, { transaction });
    if (!event) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.eventNotFound'), 404));
    }
    if (event.supervisorId && event.supervisorId !== data.supervisorId) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.this event is not for this supervisor'), 404));
    }

    const eventStartDate = new Date(event.startApplyDate).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);

    if (eventStartDate <= today) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.cannotDeleteStartedEvent'), 400));
    }

    await event.destroy({ transaction });
    await transaction.commit();
    return event;
  });

  public deleteEventServiceForAdmin = catchAsyncService(async (eventId: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const event = await Event.scope('withHidden').findByPk(eventId, { transaction });
    if (!event) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.eventNotFound'), 404));
    }

    const eventStartDate = new Date(event.startApplyDate).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);

    if (eventStartDate <= today) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.eventDeleteStartAlready'), 400));
    }

    await event.destroy({ transaction });
    await transaction.commit();
    return event;
  });

  public getTop10Events = catchAsyncNext(async (next: NextFunction) => {
    // const transaction = await this.sequelize.transaction();
    const events = await Event.findAll({
      include: [
        { model: EventType, as: 'eventTypeRelation' },
        { model: Province, as: 'provinceRelation' },
        {
          model: Supervisor,
          as: 'supervisor',
          required: false,
          where: {
            blocked: false,
            deletedAt: null,
            deactivated: false,
          },
          attributes: ['id'],
          // include: [
          //   {
          //     model: User,
          //     as: 'user',
          //   },
          // ],
        },
        { model: RateEvent, as: 'ratings', attributes: [] },
      ],
      attributes: {
        include: [[Sequelize.fn('COALESCE', Sequelize.fn('AVG', Sequelize.col('ratings.rating')), 0), 'avgRating']],
      },
      // where: { eventStatus: { [Op.notIn]: ['CANCELEDBYSYSTEMADMIN', 'ENDED'] } },
      group: ['Event.id', 'eventTypeRelation.id', 'provinceRelation.id', 'supervisor.id'],
      order: [['visitCount', 'DESC'], Sequelize.literal('"avgRating" DESC')],
      subQuery: false,
      limit: 10,
      // transaction,
    });
    if (!events) {
      // await transaction.rollback();
      return next(new AppError(errorMessage('error.Top10Events'), 404));
    }
    // await transaction.commit();
    return events;
  });

  public suggestedEvents = catchAsyncService(async (data: SuggestEventTypeDTO, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();

    const events = await this.sequelize.transaction(async (transaction) => {
      const query = `
  WITH RankedEvents AS (
  SELECT 
      "Event".*,  
      json_build_object(
          'id', "EventType"."id",
          'typeName', "EventType"."typeName",
          'description', "EventType"."description"
      ) AS "eventTypeRelation",
      json_build_object(
          'id', "Province"."id",
          'provinceName', "Province"."provinceName"
      ) AS "provinceRelation",
      ROW_NUMBER() OVER (PARTITION BY "eventType", "province" ORDER BY "visitCount" DESC) AS "rank"
  FROM "Event"
    LEFT JOIN "EventType" ON "Event"."eventType" = "EventType"."id"
    LEFT JOIN "Province" ON "Event"."province" = "Province"."id"
  WHERE "province" IN (${data.userProvinces?.join(',')})
  AND "eventType" IN (${data.userEventTypes?.join(',')})
),
CollectedEvents AS (
  SELECT * FROM RankedEvents WHERE "rank" = 1 
  UNION ALL
  SELECT * FROM RankedEvents WHERE "rank" = 2 
  UNION ALL
  SELECT * FROM RankedEvents WHERE "rank" = 3 
),
FinalEvents AS (
  SELECT * FROM CollectedEvents
  ORDER BY "rank", "visitCount" DESC 
  LIMIT 5
)
SELECT *
FROM FinalEvents;
`;
      const result = await this.sequelize.query(query, {
        type: QueryTypes.SELECT,
        transaction,
      });
      return result;
    });

    if (!events) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.suggested not found'), 404));
    }
    await transaction.commit();
    return events;
  });

  public getRateAppNotification = catchAsyncService(
    async (data: { supervisorId: number; isAccepted: boolean }, next: NextFunction) => {
      const eventCount = await Event.scope('withHidden').count({
        where: { supervisorId: data.supervisorId, isApproved: true },
      });
      if ((eventCount === 1 || eventCount % 3 === 0) && eventCount !== 0 && !data.isAccepted) return true;
      return false;
    },
  );

  // public getTicketsReportForSupervisor

  public getFinanceSupervisorreportForEventService = async (supervisorId: number, eventId: number) => {
    try {
      // Ownership check (fast fail)
      const event = await Event.scope('withHidden').findOne({
        where: {
          id: eventId,
          supervisorId,
        },
        attributes: ['id'],
      });

      if (!event) return [];

      const result = await sequelize.query(
        `
WITH date_range AS (
  SELECT generate_series(
    (
      SELECT MIN(b."createdAt")::date
      FROM "BookTicket" b
      JOIN "Event" e ON e.id = b."eventId"
      WHERE b."eventId" = :eventId
        AND e."supervisorId" = :supervisorId
    ),
    (
      SELECT MAX(b."createdAt")::date
      FROM "BookTicket" b
      JOIN "Event" e ON e.id = b."eventId"
      WHERE b."eventId" = :eventId
        AND e."supervisorId" = :supervisorId
    ),
    interval '1 day'
  )::date AS day
)
SELECT
  d.day,
  SUM(b."totalPrice") AS "totalRevenue"
FROM date_range d
JOIN "BookTicket" b
  ON b."createdAt"::date = d.day
JOIN "Event" e
  ON e.id = b."eventId"
WHERE
  b."eventId" = :eventId
  AND e."supervisorId" = :supervisorId
  AND b."status" = 'approved'
  AND b."paymentStatus" = 'completed'
GROUP BY d.day
ORDER BY d.day ASC;
      `,
        {
          replacements: { supervisorId, eventId },
          type: QueryTypes.SELECT,
        },
      );

      return result;
    } catch (error: any) {
      throw new AppError(error, 400);
    }
  };

  public getFinanceSupervisorreportForAllEventsService = async (supervisorId: number) => {
    try {
      const result = await sequelize.query(
        `
WITH date_range AS (
  SELECT generate_series(
    (
      SELECT MIN(b."createdAt")::date
      FROM "BookTicket" b
      JOIN "Event" e ON e.id = b."eventId"
      WHERE e."supervisorId" = :supervisorId
    ),
    (
      SELECT MAX(b."createdAt")::date
      FROM "BookTicket" b
      JOIN "Event" e ON e.id = b."eventId"
      WHERE e."supervisorId" = :supervisorId
    ),
    interval '1 day'
  )::date AS day
)
SELECT
  d.day,
  SUM(b."totalPrice") AS "totalRevenue"
FROM date_range d
JOIN "BookTicket" b
  ON b."createdAt"::date = d.day
JOIN "Event" e
  ON e.id = b."eventId"
WHERE
  e."supervisorId" = :supervisorId
  AND b."status" = 'approved'
  AND b."paymentStatus" = 'completed'
GROUP BY d.day
ORDER BY d.day ASC;

      `,
        {
          replacements: { supervisorId },
          type: QueryTypes.SELECT,
        },
      );

      return result;
    } catch (error: any) {
      throw new AppError(error, 400);
    }
  };

  public getEventStatusAggregationForDashboardMainPage = async () => {
    const EVENT_STATUSES: string[] = (Event.getAttributes().eventStatus!.type as any).values;

    const results = await Event.findAll({
      attributes: ['eventStatus', [Event.sequelize!.fn('COUNT', Event.sequelize!.col('id')), 'count']],
      group: ['eventStatus'],
      raw: true,
    });

    const statusCounts: EventStatusCount = {};
    EVENT_STATUSES.forEach((status) => {
      statusCounts[status] = 0;
    });

    results.forEach((row: any) => {
      statusCounts[row.eventStatus] = parseInt(row.count, 10);
    });

    return statusCounts;
  };

  private async eventTimerProcedure() {
    try {
      await this.sequelize.query(`
CREATE OR REPLACE PROCEDURE event_timer()
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count INT;
BEGIN
  -- We compare everything against UTC NOW
  SET LOCAL timezone TO 'UTC';

  UPDATE "Event"
  SET "eventStatus" = CASE
    
    -- 1. Check for ENDED (Priority 1)
    WHEN "eventStatus" = 'live'
         AND ("endEventDate"::timestamp + to_timestamp("endEventHour",'HH12:MI AM')::time) AT TIME ZONE 'Asia/Damascus' <= NOW()
    THEN 'ended'

    -- 2. Check for LIVE (Priority 2)
    WHEN "eventStatus" IN ('available','startingSoon','soldOut')
         AND ("startEventDate"::timestamp + to_timestamp("startEventHour",'HH12:MI AM')::time) AT TIME ZONE 'Asia/Damascus' <= NOW()
    THEN 'live'

    -- 2.5
    WHEN "eventStatus" IN ('available','soldOut')
         AND ("startEventDate"::timestamp + to_timestamp("startEventHour",'HH12:MI AM')::time) AT TIME ZONE 'Asia/Damascus' >= NOW()
         AND ("endApplyDate"::timestamp + to_timestamp("endEventHour",'HH12:MI AM')::time) AT TIME ZONE 'Asia/Damascus' <= NOW()
    THEN 'startingSoon'

    -- 3. Check for STARTING SOON / AVAILABLE (Priority 3)
    WHEN "eventStatus" = 'commingSoon'
         AND ("startApplyDate"::timestamp + to_timestamp("startEventHour",'HH12:MI AM')::time) AT TIME ZONE 'Asia/Damascus' <= NOW()
    THEN 'available'

    ELSE "eventStatus"
  END
  WHERE "eventStatus" NOT IN ('canceledBySystemAdmin','ended');

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  PERFORM updated_count;
END;
$$;
`);
      //       await this.sequelize.query(
      //         `
      // CREATE OR REPLACE PROCEDURE event_timer()
      // LANGUAGE plpgsql AS $$
      // BEGIN
      //   UPDATE "Event"
      //   SET "eventStatus" = CASE
      //     WHEN "eventStatus" = '${EventStatus.COMMINGSOON}' AND ("startApplyDate"::timestamp + to_timestamp("startEventHour",'HH12:MI AM')::time) <= NOW() THEN '${EventStatus.AVAILABLE}'
      //     WHEN "eventStatus" = '${EventStatus.AVAILABLE}' AND ("startEventDate"::timestamp + to_timestamp("startEventHour",'HH12:MI AM')::time) > NOW() AND ("endApplyDate"::timestamp + to_timestamp("startEventHour",'HH12:MI AM')::time) <= NOW() THEN '${EventStatus.STARTINGSOON}'
      //     WHEN "eventStatus" IN ('${EventStatus.AVAILABLE}','${EventStatus.STARTINGSOON}') AND ("startEventDate"::timestamp + to_timestamp("startEventHour",'HH12:MI AM')::time) <= NOW() THEN '${EventStatus.LIVE}'
      //     WHEN "eventStatus" = '${EventStatus.LIVE}' AND ("endEventDate"::timestamp + to_timestamp("endEventHour",'HH12:MI AM')::time) <= NOW() THEN '${EventStatus.ENDED}'
      //     ELSE "eventStatus"
      //   END
      //   WHERE "eventStatus" NOT IN ('${EventStatus.CANCELEDBYSYSTEMADMIN}','${EventStatus.ENDED}');
      // END;
      // $$;
      // `,
      //       );

      console.log('Stored procedure event_timer created at:', new Date().toISOString());
    } catch (error: Error | unknown) {
      console.error('Failed to create stored procedure event_timer:', (error as Error).message);
      throw error;
    }
  }

  private async runImmediateTimer() {
    if (this.lastImmediateRun && new Date().getTime() - this.lastImmediateRun.getTime() < 60_000) {
      console.log('(EVENT TIMER) Skipped immediate event timer: Recent run at', this.lastImmediateRun.toISOString());
      return;
    }
    try {
      await this.sequelize.query('CALL event_timer()');
      this.lastImmediateRun = new Date();
      console.log('(EVENT TIMER) Immediate event timer executed at', this.lastImmediateRun.toISOString());
    } catch (error: Error | unknown) {
      console.error('(EVENT TIMER) Immediate event timer failed:', (error as Error).message);
    }
  }

  private async setupScheduler() {
    try {
      const [extensions] = await this.sequelize.query("SELECT * FROM pg_available_extensions WHERE name = 'pg_cron'");
      if (extensions.length > 0) {
        await this.setupPgCron();
      } else {
        console.log('(EVENT TIMER) pg_cron unavailable, falling back to node-cron');
        this.scheduleNodeCron();
      }
    } catch (error: Error | unknown) {
      console.error('(EVENT TIMER) Failed to check pg_cron availability:', (error as Error).message);
      this.scheduleNodeCron();
    }
  }

  private async setupPgCron() {
    try {
      await this.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_cron');
      await this.sequelize.query("SELECT cron.unschedule('event_timer')");
      await this.sequelize.query(`
          SELECT cron.schedule('cancel-unpaid', '1 * * * *', $$
            CALL event_timer();
          $$);
        `);
      console.log('(EVENT TIMER) pg_cron scheduled: event_timer every 1 minute.');
    } catch (error: Error | unknown) {
      console.error('(EVENT TIMER) pg_cron scheduling failed:', (error as Error).message);
      this.scheduleNodeCron();
    }
  }

  private scheduleNodeCron() {
    if (this.cronScheduled) {
      console.log('(EVENT TIMER) node-cron already scheduled, skipping');
      return;
    }
    cron.schedule('0 * * * * *', async () => {
      try {
        await this.sequelize.query('CALL event_timer()', { logging: console.log, type: QueryTypes.RAW, raw: true });

        console.log('(EVENT TIMER) Stored procedure called successfully at', new Date().toISOString());
      } catch (error: Error | unknown) {
        console.error('(EVENT TIMER) Stored procedure call failed:', (error as Error).message);
      }
    });
    this.cronScheduled = true;
    console.log('(EVENT TIMER) node-cron scheduled: event_timer every 1 minute.');
  }

  private scheduleNodeCornForRateEventsAfterEnding() {
    cron.schedule('*/30 * * * *', async () => {
      console.log(`[${new Date().toISOString()}] Running event rating reminder check...`);

      const transaction = await this.sequelize.transaction();
      try {
        const now = new Date();
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

        const events = await Event.findAll({
          where: {
            hasSentRateReminder: false,
            [Op.and]: [
              sequelize.literal(`
        (
          "endEventDate"::timestamp + 
          to_timestamp("endEventHour", 'HH12:MI AM')::time
        ) AT TIME ZONE 'Asia/Damascus' 
        BETWEEN :startTime AND :endTime
      `),
            ],
            // endEventDate: {
            // [Op.between]: [new Date(thirtyMinutesAgo.getTime() - 60 * 1000), thirtyMinutesAgo],

            // },
          },
          replacements: {
            // thirtyMinutesAgo is the "end" of your window
            endTime: thirtyMinutesAgo.toISOString(),
            // thirty-one minutes ago is the "start" of your window
            startTime: new Date(thirtyMinutesAgo.getTime() - 60 * 1000).toISOString(),
          },
          transaction,
        });

        const userType = 'normalUser';

        for (const event of events) {
          const users = await bookTicketService.getUsersBookForEvent(event.id);

          await Promise.all(
            users.map(async (user) => {
              const notificationPayload = {
                title: commonMessage('common.approveEventTitle'),
                body: commonMessage('common.approveEventBody'),
                data: {
                  eventId: String(event.id),
                  eventName: event.eventName,
                  userType,
                  userId: String(user.userId),
                  uniqueValue: user.user.mobileNumber,
                },
                type: NotificationTypes.RATEEVENT,
              };
              await PushNotificationService.sendToUser(user.userId, notificationPayload, userType);
            }),
          );

          // await event.update({ hasSentRateReminder: true }, { transaction });
          event.hasSentRateReminder = true;
          await event.save({ skipPreHooks: true, transaction } as CustomUpdateOptions);
        }
        await transaction.commit();
      } catch (err) {
        await transaction.rollback();
        console.error('Rating reminder cron failed:', err);
      }
    });
  }

  private generateFilePath(fileName: string, type: string): string {
    let relativePath: string;

    switch (type) {
      case 'mainPhoto':
        relativePath = path.posix.join('events', 'main', encodeURIComponent(fileName));
        break;
      case 'miniPoster':
        relativePath = path.posix.join('events', 'miniPoster', encodeURIComponent(fileName));
        break;
      case 'eventPhotos':
        relativePath = path.posix.join('events', 'others', encodeURIComponent(fileName));
        break;
      default:
        throw new Error('Invalid type specified.');
    }
    return `${pathName}/${relativePath}`;
  }
}
export default new EventService(sequelize);
