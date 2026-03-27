import { NextFunction, Response } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import catchAsync from '../utils/catchAsync.js';
import User from '../models/user.model';
import NormalUser from '../models/normalUser.model';
import AppError from '../utils/AppError.js';
import {
  NormalUserPayload,
  AdminPayload,
  SupervisorPayload,
  ScannerUserPayload,
} from '../interfaces/auth/payload.interface';
import DashboardAdmin from '../models/dashboardAdmin.model';
import { Supervisor } from '../models/supervisor.model.js';
import EventType from '../models/eventType.model';
import Province from '../models/provinces.model';
import { errorMessage } from '../modules/i18next.config';
import ScannerUser from '../models/scannerUser.model.js';

function jwtVerify(
  token: string,
  secret: string,
): Promise<NormalUserPayload | AdminPayload | SupervisorPayload | ScannerUserPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) return reject(err);

      resolve(decoded as NormalUserPayload | AdminPayload | SupervisorPayload | ScannerUserPayload);
    });
  });
}

const protect = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
  let token: string = '';
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next(new AppError('Your are not log in .. please login to get access', 401));

  // const jwtVerify = promisify(jwt.verify);
  const decoded = (await jwtVerify(token, process.env.JWT_SECRET ?? '')) as JwtPayload;
  if (decoded.iss === 'normalUser') {
    const currentUser = await NormalUser.findOne({
      where: { mobileNumber: decoded.payload.mobileNumber },
      include: [
        { model: User, as: 'user' },
        { model: EventType, through: { attributes: [] }, as: 'eventTypes' },
        { model: Province, as: 'provinces', through: { attributes: [] } },
      ],
    });
    if (!currentUser) return next(new AppError(errorMessage('error.userNotFound'), 401));
    if (currentUser.blocked) return next(new AppError(errorMessage('error.blockedAccount'), 403));
    if (req.originalUrl.startsWith('/api/dashboard'))
      return next(new AppError(errorMessage('error.accessForbidden'), 403));

    req.normalUserFromReq = currentUser;
    req.adminFromReq = undefined;
    req.notificationUser = currentUser.userId;
  } else if (decoded.iss === 'dashboard admin') {
    const currentAdmin = await DashboardAdmin.findOne({
      where: { email: decoded.payload.email },
    });
    if (!currentAdmin) return next(new AppError(errorMessage('error.adminNotFound'), 401));
    if (!req.originalUrl.startsWith('/api/dashboard'))
      return next(new AppError(errorMessage('error.accessForbidden'), 403));

    req.adminFromReq = currentAdmin;
    req.normalUserFromReq = undefined;
    req.supervisorFromReq = undefined;
  } else if (decoded.iss === 'supervisor') {
    if (req.originalUrl.startsWith('/api/dashboard'))
      return next(new AppError(errorMessage('error.accessForbidden'), 403));
    const currentSupervisor = await Supervisor.findOne({
      where: { username: decoded.payload.username },
    });
    if (!currentSupervisor) return next(new AppError(errorMessage('error.supervisorNotFound'), 401));
    if (currentSupervisor.blocked) return next(new AppError(errorMessage('error.blockedAccount'), 403));

    req.supervisorFromReq = currentSupervisor;
    req.adminFromReq = undefined;
    req.notificationUser = currentSupervisor.userId;
  } else if (decoded.iss === 'scanner') {
    if (req.originalUrl.startsWith('/api/dashboard'))
      return next(new AppError(errorMessage('error.accessForbidden'), 403));

    const currentScannerUser = await ScannerUser.findOne({
      where: { name: decoded.payload.name },
      include: [
        {
          model: Supervisor,
          as: 'supervisor',
        },
      ],
      // raw: false,
      // nest: true,
    });
    if (currentScannerUser?.dataValues.supervisor!.blocked)
      return next(new AppError(errorMessage('error.blockedAccount'), 403));

    if (!currentScannerUser) return next(new AppError(errorMessage('error.scannerUserserNotRegistered'), 401));
    req.scannerUserFromRequest = currentScannerUser;
    req.adminFromReq = undefined;
    req.supervisorFromReq = undefined;
    req.notificationUser = currentScannerUser.id;
  } else {
    return next(new AppError(errorMessage('error.invalidTokenIssuer'), 403));
  }
  next();
});

export default protect;
