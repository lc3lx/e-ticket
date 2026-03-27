import { NextFunction, Response } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import RequestMessage from '../models/requestMessage.model';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response';
import { errorMessage } from '../modules/i18next.config';
import { Sequelize } from 'sequelize';

class MessageController {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public addRequestMessage = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();

    const { supervisorRequestId, message } = req.body;
    let senderRole: 'supervisor' | 'admin' = 'supervisor';
    if (req.originalUrl.split('/').includes('admin')) senderRole = 'admin';

    const lastMessage = await RequestMessage.findOne({
      where: { supervisorRequestId: Number(supervisorRequestId) },
      order: [['createdAt', 'DESC']],
      transaction,
    });

    if (lastMessage && lastMessage.senderRole === senderRole) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.messageReply'), 400));
    }

    const newMessage = await RequestMessage.create(
      {
        supervisorRequestId: supervisorRequestId,
        senderRole: senderRole,
        message: message,
      },
      { transaction },
    );

    await transaction.commit();
    const messageSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { newMessage },
    };
    res.status(201).json(messageSuccessResponse);
  });

  public getAllMessagesByRequestId = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const requestId = Number(req.params.requestId);
    if (!requestId) return next(new AppError('cannot send a request without requestId', 400));

    const transaction = await this.sequelize.transaction();
    const messages = await RequestMessage.findAll({ where: { supervisorRequestId: requestId }, transaction });

    await transaction.commit();
    const messageSuccessResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { messages },
    };
    res.status(201).json(messageSuccessResponse);
  });
}

import { sequelize } from '../DB/sequelize.js';
export default new MessageController(sequelize);
