import { NextFunction } from 'express';
import { Sequelize, Transaction } from 'sequelize';
import path from 'path';
import pathName from '../utils/serverAndPort.js';
import Agent from '../models/agent.model.js';
import Province from '../models/provinces.model.js';
import AppError from '../utils/AppError.js';
import { validateForeignKey } from '../utils/validateForeignKey.js';
import APIFeatures from '../utils/apiFeatures.js';
import catchAsyncReqNext from '../utils/catchAsyncReqNext.js';
import catchAsyncService from '../utils/catchAsyncService.js';
import { errorMessage } from '../modules/i18next.config';
import { createAgentSchema } from '../modules/zodValidation/agent/createAgent.config.js';
import { updateAgentSchema } from '../modules/zodValidation/agent/updateAgent.config.js';
import { sequelize } from '../DB/sequelize.js';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto.js';
import upload from '../modules/multer.config.js';

interface CreateAgentDto {
  name: string;
  agentPhoto?: string;
  provinceId?: number;
  location: string;
  mobileNumber: string;
}

interface UpdateAgentDto extends Partial<CreateAgentDto> {
  agentId: number | undefined;
}

export class AgentService {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public createAgent = catchAsyncService(async (data: CreateAgentDto, next: NextFunction) => {
    const { name, location, mobileNumber } = data;

    const parsedData = await createAgentSchema.safeParseAsync(data);
    if (!parsedData.success) {
      return next(parsedData.error);
    }
    const transaction = await this.sequelize.transaction();

    const existingAgent = await Agent.findOne({ transaction, where: { mobileNumber } });
    if (existingAgent) {
      return next(new AppError(errorMessage('error.agentExists'), 400));
    }

    if (data.provinceId) {
      if (!(await validateForeignKey(Province, data.provinceId, 'Province'))) {
        return next(new AppError(errorMessage('error.provincesNotFound'), 400));
      }
    }

    const createdAgent = await Agent.create(data, { transaction });
    const agent = await Agent.findByPk(createdAgent.id, {
      transaction,
      include: [
        {
          model: Province,
          as: 'province',
        },
      ],
    });
    transaction.commit();
    return agent;
  });

  public getAgentById = catchAsyncService(async (agentId: number, next: NextFunction) => {
    const agent = await Agent.findByPk(agentId, {
      include: [
        {
          model: Province,
          as: 'province',
        },
      ],
    });

    if (!agent) {
      return next(new AppError(errorMessage('error.agentNotFound'), 404));
    }

    return agent;
  });

  public getAllAgents = catchAsyncReqNext(async (req, next: NextFunction) => {
    const includeOptions = [
      {
        model: Province,
        as: 'province',
      },
    ];

    const features = new APIFeatures(Agent, req.query as unknown as Record<string, string>, {
      include: includeOptions,
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await Agent.count({
      where: features.query.where,
      include: includeOptions,
    });

    const agents = await features.execute();

    if (!agents) {
      return next(new AppError(errorMessage('error.agentNotFound'), 404));
    }

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = agents.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: agents,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public updateAgent = catchAsyncService(async (data: UpdateAgentDto, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();

    try {
      const agent = await Agent.findByPk(data.agentId, { transaction });
      if (!agent) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.agentNotFound'), 404));
      }

      delete data.agentId;
      if (agent && agent.mobileNumber === data.mobileNumber) data.mobileNumber = undefined;

      const parsedData = await updateAgentSchema.safeParseAsync(data);
      if (!parsedData.success) {
        await transaction.rollback();
        return next(parsedData.error);
      }

      const updatedAgent = await agent.update(data, { transaction });
      await transaction.commit();

      return updatedAgent;
    } catch (error) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.agentUpdateFailed'), 500));
    }
  });

  public deleteAgent = catchAsyncService(async (agentId: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();

    try {
      const agent = await Agent.findByPk(agentId, { transaction });
      if (!agent) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.agentNotFound'), 404));
      }
      await agent.destroy({ transaction });
      await transaction.commit();

      return true;
    } catch (error) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.agentDeleteFailed'), 500));
    }
  });

  public uploadSingleImageAgentService = upload.single('agentPhoto');

  public saveAgentImageOnUpdate = catchAsyncReqNext(async (req: CustomRequest, next: NextFunction) => {
    const agentName = req.body.name;

    if (!agentName) return next(new AppError('agnet name not found in the context', 400));

    const fileName = new URL(path.join('agentPhoto', req.body.agentPhoto), pathName).href;
    req.body.agentPhoto = fileName;
  });
}

export default new AgentService(sequelize);
