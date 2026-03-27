import { NextFunction, Response } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import AppError from '../utils/AppError.js';
import { errorMessage } from '../modules/i18next.config';
import AdminTypes from '../common/enums/adminTypes.enum';

function requirePrivilege(...allowedPrivileges: string[]) {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    if (req.normalUserFromReq || req.supervisorFromReq || req.scannerUserFromRequest) {
      return next();
    }
    if (!req.adminFromReq) {
      return next(new AppError(errorMessage('error.noPermission'), 403));
    }

    allowedPrivileges.push(AdminTypes.SuperAdmin, AdminTypes.CEO);
    if (allowedPrivileges.length > 0) {
      const adminPrivilege = req.adminFromReq.role;
      if (!allowedPrivileges.includes(adminPrivilege)) {
        return next(new AppError(errorMessage('error.noPermission'), 403));
      }
    }

    next();
  };
}

export default requirePrivilege;
