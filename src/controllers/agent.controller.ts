import { Response, NextFunction } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import agentService from '../services/agent.service';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response.js';
import { errorMessage } from '../modules/i18next.config';

interface CreateAgentRequest extends CustomRequest {
  body: {
    name: string;
    agentPhoto?: string;
    provinceId?: number;
    location: string;
    mobileNumber: string;
  };
}

interface UpdateAgentRequest extends CustomRequest {
  body: Partial<CreateAgentRequest['body']>;
}

class AgentController {
  public createAgent = catchAsync(async (req: CreateAgentRequest, res: Response, next: NextFunction) => {
    const { name, agentPhoto, provinceId, location, mobileNumber } = req.body;

    const agent = await agentService.createAgent({ name, agentPhoto, provinceId, location, mobileNumber }, next);

    if (!agent) {
      return next(new AppError(errorMessage('error.agentCreationFailed'), 400));
    }

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { agent },
    };

    res.status(201).json(successResponse);
  });

  public getAgent = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { agentId } = req.params;

    if (!agentId) {
      return next(new AppError(errorMessage('error.missingAgentId'), 400));
    }

    const agent = await agentService.getAgentById(Number(agentId), next);

    if (!agent) {
      return next(new AppError(errorMessage('error.agentNotFound'), 404));
    }

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { agent },
    };
    res.status(200).json(successResponse);
  });

  public getAllAgents = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const allAgents = await agentService.getAllAgents(req, next);

    if (!allAgents) {
      return next(new AppError(errorMessage('error.agentNotFound'), 404));
    }

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { allAgents },
    };
    res.status(200).json(successResponse);
  });

  public updateAgent = catchAsync(async (req: UpdateAgentRequest, res: Response, next: NextFunction) => {
    const { agentId } = req.params;

    if (!agentId) {
      return next(new AppError(errorMessage('error.missingAgentId'), 400));
    }
    const data = { ...req.body, agentId: Number(agentId) };

    const updatedAgent = await agentService.updateAgent(data, next);

    if (!updatedAgent) {
      return next(new AppError(errorMessage('error.agentUpdateFailed'), 400));
    }

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { agent: updatedAgent },
    };

    res.status(200).json(successResponse);
  });

  public deleteAgent = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { agentId } = req.params;

    if (!agentId) {
      return next(new AppError(errorMessage('error.missingAgentId'), 400));
    }
    const success = await agentService.deleteAgent(Number(agentId), next);

    if (!success) {
      return next(new AppError(errorMessage('error.agentDeleteFailed'), 400));
    }
    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      message: '',
    };
    res.status(204).json(successResponse);
  });

  public uploadAgentImage = agentService.uploadSingleImageAgentService;

  public saveAgentPhoto = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.file) return next();
    await agentService.saveAgentImageOnUpdate(req, next);
    next();
  });
}

export default new AgentController();
