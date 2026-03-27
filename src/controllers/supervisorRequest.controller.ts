import { NextFunction, Response } from 'express';
import { ModelStatic, Op } from 'sequelize';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import User from '../models/user.model';
import SupervisorRequest from '../models/supervisorRequest.model';
import RequestMessage from '../models/requestMessage.model';
import { PendingSupervisorChanges, Supervisor } from '../models/supervisor.model';
import Event from '../models/event.model';
import PendingEvent from '../models/eventPending.model';
import catchAsync from '../utils/catchAsync.js';
import { Sequelize } from 'sequelize';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response';
import AppError from '../utils/AppError.js';
import APIFeatures from '../utils/apiFeatures.js';
import EventType from '../models/eventType.model';
import Province from '../models/provinces.model';

class SupervisorRequestController {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public getAllRequestsForAdmin = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { type } = req.params;
    // const transaction = await this.sequelize.transaction();

    const queryOptions: Record<string, any> = {};
    const includeOptions: any[] = [];

    switch (type) {
      case 'eventCreate':
        includeOptions.push({
          model: Supervisor,
          as: 'supervisor',
          // Change to true if you ONLY want events that have a supervisor
          required: true,
          include: [
            { model: User, as: 'user' },
            { model: EventType, as: 'eventTypes' },
            { model: Province, as: 'provinceRelation' },
            {
              model: SupervisorRequest,
              as: 'SupervisorRequest',
              // This MUST be true if you are filtering by it,
              // otherwise the record wouldn't exist to match the type
              required: true,
              where: {
                requestType: type,
                requestTargetId: { [Op.col]: 'Event.id' },
              },
              include: [{ model: RequestMessage, as: 'messages', required: false }],
              order: [['createdAt', 'DESC']],
            },
          ],
        });

        includeOptions.push({ model: EventType, as: 'eventTypeRelation' });
        includeOptions.push({ model: Province, as: 'provinceRelation' });

        // Clean up the top-level where
        queryOptions.where = {
          isApproved: false,
        };
        queryOptions.include = includeOptions;
        break;

      case 'eventUpdate':
        includeOptions.push({
          model: EventType,
          as: 'eventTypeRelation',
        });
        includeOptions.push({
          model: Province,
          as: 'provinceRelation',
        });
        includeOptions.push({
          model: Event,
          as: 'originalEvent',
          required: false,
          include: [
            {
              model: EventType,
              as: 'eventTypeRelation',
            },
            {
              model: Province,
              as: 'provinceRelation',
            },
            {
              model: Supervisor,
              as: 'supervisor',
              required: false,
              include: [
                { model: User, as: 'user', required: false },
                {
                  model: SupervisorRequest,
                  as: 'SupervisorRequest',
                  required: false,
                  include: [{ model: RequestMessage, as: 'messages', required: false }],
                  where: {
                    requestType: type,
                    requestTargetId: { [Op.eq]: this.sequelize.col('PendingEvent.eventId') },
                  },
                  order: [['createdAt', 'DESC']],
                },
              ],
            },
          ],
        });
        queryOptions.where = { isUpdateApproved: false };
        queryOptions.include = includeOptions;
        break;

      case 'profileUpdate':
        includeOptions.push({
          model: Province,
          as: 'provinceRelation',
          required: false,
        });
        includeOptions.push({
          model: Supervisor,
          as: 'supervisor',
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              required: false,
            },
            {
              model: Province,
              as: 'provinceRelation',
              required: false,
            },
            {
              model: SupervisorRequest,
              as: 'SupervisorRequest',
              required: false,
              include: [{ model: RequestMessage, as: 'messages', required: false }],
              where: {
                requestType: type,
                requestTargetId: { [Op.eq]: this.sequelize.col('PendingSupervisorChanges.supervisorId') },
              },
              order: [['createdAt', 'DESC']],
            },
          ],
        });
        queryOptions.where = { isApproved: false };
        queryOptions.include = includeOptions;
        break;

      case 'profileDelete':
        includeOptions.push({
          model: User,
          as: 'user',
          required: false,
        });
        includeOptions.push({
          model: Province,
          as: 'provinceRelation',
        });
        includeOptions.push({
          model: SupervisorRequest,
          as: 'SupervisorRequest',
          required: false,
          include: [{ model: RequestMessage, as: 'messages', required: false }],
          where: {
            requestType: type,
            requestTargetId: { [Op.eq]: this.sequelize.col('Supervisor.id') },
          },
          order: [['createdAt', 'DESC']],
        });
        queryOptions.where = { deletePending: true };
        queryOptions.include = includeOptions;
        break;

      default:
        return next(new AppError('Invalid request type', 400));
    }

    const features = new APIFeatures(
      (type === 'eventCreate'
        ? Event.scope('withHidden')
        : type === 'eventUpdate'
          ? PendingEvent
          : type === 'profileUpdate'
            ? PendingSupervisorChanges
            : Supervisor) as unknown as ModelStatic<any>,
      req.query as unknown as Record<string, string>,
      queryOptions,
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await features.model.count({
      where: queryOptions.where,
      include: queryOptions.include,
      distinct: true,
      // col: 'id',
      // subQuery: false,
      // subQuery: false,
      // logging: (sql) => console.log('COUNT SQL →', sql),
      // logging: console.log,
      // transaction,
    });

    // console.log('--- Admin Query Options ---', JSON.stringify(queryOptions, null, 2));

    const result = await features.execute();
    // const result = await features.execute({
    //   logging: (sql) => console.log('MAIN SQL →', sql),
    // });

    // const result = await features.execute(transaction);

    if (!result) return next(new AppError('No requests found', 404));

    const totalPages = Math.ceil(totalCount / features.limit);
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    // await transaction.commit();

    const requestsSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { result },
    };
    res.status(200).json({
      ...requestsSuccessResponse,
      pagination: {
        page: features.page,
        totalPages,
        totalItemsInPage: result.length,
        limit: features.limit,
        totalCount,
        hasPreviousPage,
        hasNextPage,
      },
    });
  });

  public getAllRequestsForSupervisor = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { type } = req.params;
    let workTypeDetails: EventType[] = [];
    const supervisorId = req.supervisorFromReq?.id;
    // const transaction = await this.sequelize.transaction();
    let queryModel: ModelStatic<any>;
    let queryOptions: Record<string, any> = {};

    if (type === 'eventCreate') {
      queryModel = Event.scope('withHidden');
      queryOptions = {
        where: { isApproved: false, supervisorId },
        required: true,
        // transaction,
        include: [
          {
            model: EventType,
            as: 'eventTypeRelation',
          },
          {
            model: Province,
            as: 'provinceRelation',
          },
          {
            model: Supervisor,
            required: true,
            as: 'supervisor',
            include: [
              {
                model: User,
                as: 'user',
              },
              {
                model: EventType,
                as: 'eventTypes',
              },
              {
                model: Province,
                as: 'provinceRelation',
              },
              {
                model: SupervisorRequest,
                as: 'SupervisorRequest',
                required: false,
                include: [{ model: RequestMessage, as: 'messages', required: false }],
                where: {
                  requestType: type,
                  requestTargetId: {
                    [Op.eq]: this.sequelize.col('Event.id'),
                  },
                },
                order: [['createdAt', 'DESC']],
              },
            ],
          },
        ],
      };
    } else if (type === 'eventUpdate') {
      queryModel = PendingEvent.scope('withAll');
      queryOptions = {
        where: { supervisorId },
        // transaction,
        include: [
          {
            model: EventType,
            as: 'eventTypeRelation',
          },
          {
            model: Province,
            as: 'provinceRelation',
          },
          {
            model: Event,
            as: 'originalEvent',
            required: false,
            include: [
              {
                model: EventType,
                as: 'eventTypeRelation',
              },
              {
                model: Province,
                as: 'provinceRelation',
              },
              {
                model: Supervisor,
                as: 'supervisor',
                required: false,
                include: [
                  {
                    model: SupervisorRequest,
                    as: 'SupervisorRequest',
                    required: false,
                    include: [{ model: RequestMessage, as: 'messages', required: false }],
                    where: {
                      requestType: type,
                      requestTargetId: {
                        [Op.eq]: this.sequelize.col('PendingEvent.eventId'),
                      },
                    },
                    order: [['createdAt', 'DESC']],
                  },
                ],
              },
            ],
          },
        ],
      };
    } else if (type === 'profileUpdate') {
      queryModel = PendingSupervisorChanges;
      queryOptions = {
        where: { supervisorId },
        // transaction,
        include: [
          {
            model: Province,
            as: 'provinceRelation',
            required: false,
          },
          {
            model: Supervisor,
            as: 'supervisor',
            required: false,
            include: [
              {
                model: User,
                as: 'user',
                required: false,
              },
              {
                model: Province,
                as: 'provinceRelation',
              },
              {
                model: EventType,
                as: 'eventTypes',
              },
              {
                model: SupervisorRequest,
                as: 'SupervisorRequest',
                required: false,
                include: [{ model: RequestMessage, as: 'messages', required: false }],
                where: {
                  requestType: type,
                  requestTargetId: {
                    [Op.eq]: this.sequelize.col('PendingSupervisorChanges.supervisorId'),
                  },
                },
                order: [['createdAt', 'DESC']],
              },
            ],
          },
        ],
      };
    } else if (type === 'profileDelete') {
      queryModel = Supervisor;
      queryOptions = {
        where: { deletePending: true, id: supervisorId },
        // transaction,
        include: [
          {
            model: User,
            as: 'user',
            required: false,
          },
          {
            model: Province,
            as: 'provinceRelation',
          },
          {
            model: EventType,
            as: 'eventTypes',
          },
          {
            model: SupervisorRequest,
            as: 'SupervisorRequest',
            required: false,
            include: [{ model: RequestMessage, as: 'messages', required: false }],
            where: {
              requestType: type,
              requestTargetId: {
                [Op.eq]: this.sequelize.col('Supervisor.id'),
              },
            },
            order: [['createdAt', 'DESC']],
          },
        ],
      };
    } else {
      return next(new AppError('Invalid request type.', 400));
    }

    const features = new APIFeatures(queryModel, req.query as unknown as Record<string, string>, {
      ...queryOptions,
      // transaction,
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const totalCount = await queryModel.count({
      ...queryOptions,
      distinct: true,
      // transaction,
    });
    const result = await features.execute();
    // const result = await features.execute(transaction);

    if (!result) return next(new AppError('No requests found.', 404));
    let modifiedResult = result;
    if (type === 'profileUpdate') {
      const updatedSupervisor = await PendingSupervisorChanges.findOne({ where: { supervisorId } });
      if (updatedSupervisor?.workType) {
        workTypeDetails = await EventType.findAll({
          where: {
            id: {
              [Op.in]: updatedSupervisor.workType,
            },
          },
        });
      }
      modifiedResult = result.map((entry) => {
        if (entry.supervisorId === updatedSupervisor?.supervisorId) {
          return {
            ...entry.toJSON(),
            workType: workTypeDetails,
          };
        }
        return entry;
      });
    }

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = result.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    const requestsSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: {
        page: features.page,
        totalPages,
        totalItemsInPage,
        limit: features.limit,
        totalCount,
        modifiedResult,
        hasPreviousPage,
        hasNextPage,
      },
    };

    // await transaction.commit();
    res.status(200).json(requestsSuccessResponse);
  });
}

import { sequelize } from '../DB/sequelize.js';
export default new SupervisorRequestController(sequelize);
