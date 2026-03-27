import { Response, NextFunction } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import eventTypeService, { EventType } from '../services/eventType.service.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response.js';
import { CreateEventTypeDTO } from '../interfaces/event/createEventType.dto';
import { UpdateEventTypeDTO } from '../interfaces/event/updateEventType.dto';
import { errorMessage } from '../modules/i18next.config';

class EventTypeController {
  private eventTypeService: EventType;

  constructor(eventTypeService: EventType) {
    this.eventTypeService = eventTypeService;
  }

  public getAllEventTypes = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const allEventTypes = await this.eventTypeService.getAllEventTypes(next);
    if (!allEventTypes) return next(new AppError(errorMessage('error.emptyEventTypes'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { allEventTypes },
    };
    res.status(200).json(successResponse);
  });

  public createEventType = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const data: CreateEventTypeDTO = req.body;
    const { description, typeName } = data;
    const newEventType = await this.eventTypeService.addNewEventType({ description, typeName }, next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { newEventType },
    };
    res.status(201).json(successResponse);
  });

  public updateEventType = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const updateDate: UpdateEventTypeDTO = req.body;
    const updatedEventType = await this.eventTypeService.updateEventType(updateDate, next);
    if (!updatedEventType) return next(new AppError(errorMessage('error event type not found'), 404));
    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { updatedEventType },
    };
    res.status(200).json(successResponse);
  });

  public deleteEventType = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { eventTypeId } = req.body;
    const deletedEventType = await this.eventTypeService.deleteEventType(eventTypeId, next);

    if (deletedEventType) res.status(204).json({});
  });
}

export default new EventTypeController(eventTypeService);
