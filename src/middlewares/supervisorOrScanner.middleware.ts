import { NextFunction, Response } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import AppError from '../utils/AppError.js';
import { errorMessage } from '../modules/i18next.config';

function scannerOrSupervisor(req: CustomRequest, res: Response, next: NextFunction) {
  if (req.normalUserFromReq) return next(new AppError(errorMessage('error.noPermission'), 403));
  if (req.adminFromReq) return next(new AppError(errorMessage('error.noPermission'), 403));
  if (req.scannerUserFromRequest || req.supervisorFromReq) return next();
  return next(new AppError(errorMessage('error.noPermission'), 403));
}

export default scannerOrSupervisor;
