import { NextFunction } from 'express';
import { Sequelize, Transaction } from 'sequelize';
import AppError from '../utils/AppError.js';
import catchAsyncService from '../utils/catchAsyncService.js';
import catchAsyncNext from '../utils/catchAsyncNextOnly.js';
import EventTypes from '../models/eventType.model.js';
import { CreateEventTypeDTO } from '../interfaces/event/createEventType.dto.js';
import { errorMessage } from '../modules/i18next.config';
import { UpdateEventTypeDTO } from '../interfaces/event/updateEventType.dto.js';

export class EventType {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public getAllEventTypes = catchAsyncNext(async (next: NextFunction) => {
    const eventTypes = await EventTypes.findAll({ attributes: ['id', 'typeName', 'description'] });
    if (!eventTypes) return next(new AppError(errorMessage('error.emptyEventTypes'), 400));
    return eventTypes;
  });

  public addNewEventType = catchAsyncService(async (data: CreateEventTypeDTO, next: NextFunction) => {
    const { typeName, description } = data;

    const eventType = await EventTypes.create({ typeName, description }, { validate: true });

    return eventType;
  });

  public updateEventType = catchAsyncService(async (updateEventTypeData: UpdateEventTypeDTO, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const updatedEventType = await EventTypes.findByPk(updateEventTypeData.id, { transaction });
    if (!updatedEventType) {
      await transaction.rollback();
      return next(new AppError('cannot find event type', 404));
    }
    if (updateEventTypeData.typeName) updatedEventType.typeName = updateEventTypeData.typeName;
    if (updateEventTypeData.description) updatedEventType.description = updateEventTypeData.description;
    await updatedEventType.validate();
    await updatedEventType.save({ transaction });
    await transaction.commit();

    return updatedEventType;
  });

  public deleteEventType = catchAsyncService(async (eventTypeId: number, next: NextFunction) => {
    const deletedEventType = await EventTypes.destroy({ where: { id: eventTypeId } });

    return deletedEventType;
  });
}

import { sequelize } from '../DB/sequelize.js';
export default new EventType(sequelize);
