import { NextFunction, Response, Request } from 'express';
const AppError = require('../utils/appError');

const protectSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.id || req.body.userId;
  if (userId == 1) {
    return next(new AppError('Cannot modify or delete the superadmin account', 403));
  }
  next();
};

module.exports = protectSuperAdmin;
