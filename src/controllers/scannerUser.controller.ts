import { Request, Response, NextFunction } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto.js';
import scannerUserService, { ScannerUserService } from '../services/scannerUser.service.js';
import { createSendToken, generateAccessToken, verifyToken } from '../modules/jwt.js';
import { ScannerUserPayload } from '../interfaces/auth/payload.interface.js';
import { ScannerUserLoginDto } from '../interfaces/scannerUser/scannerUserLogin.dto.js';
import UserTypes from '../common/enums/userTypes.enum.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response.js';
import { errorMessage } from '../modules/i18next.config.js';
import { loginUserSuccessResponse, LoginUserSuccessResponse } from '../common/messages/en/loginUser.response.js';
import { ChangeScannerPassword } from '../interfaces/scannerUser/changePassword.dto.js';

class ScannerUserController {
  private scannerUserService: ScannerUserService;

  constructor(scannerUserService: ScannerUserService) {
    this.scannerUserService = scannerUserService;
  }

  public scannerUserLogin = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const scannerUserData: ScannerUserLoginDto = req.body;

    const scannerUser = await scannerUserService.scannerUserLogin(scannerUserData, next);
    if (!scannerUser) return next(new AppError(errorMessage('error.scannerUserserNotRegistered'), 400));

    const payload: ScannerUserPayload = {
      userId: scannerUser.userId,
      name: scannerUserData.name,
      issuer: UserTypes.Scanner,
    };
    const { accessToken, refreshToken } = createSendToken(payload, res);

    res.setHeader('Authorization', `Bearer ${accessToken}`);
    if (refreshToken) res.setHeader('X-Refresh-Token', refreshToken);

    const loginSuccess: LoginUserSuccessResponse = {
      ...loginUserSuccessResponse(),
    };
    res.status(200).json({
      loginSuccess,
      // accessToken,
      // refreshToken,
      data: {
        scannerUser,
      },
    });
  });

  public getGeneratedAccessToken = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.body || !req.body.refreshToken) return next(new AppError('not valid body !', 400));
    const { refreshToken } = req.body;
    const verfiedToken = verifyToken(refreshToken);
    if (verfiedToken.iss !== 'scanner') return next(new AppError('you cannot refresh your token', 401));
    const { name } = verfiedToken.payload;

    if (!name) return next(new AppError(errorMessage('error.name not found'), 401));

    const scannerUserFound = await scannerUserService.getScannerUserByName(name, next);
    if (!scannerUserFound) return next(new AppError(errorMessage('error.scannerUserExist'), 404));
    const payload: ScannerUserPayload = {
      userId: scannerUserFound.userId,
      name,
      issuer: UserTypes.Scanner,
    };

    const accessToken = generateAccessToken(payload);
    if (accessToken) res.setHeader('Authorization', `Bearer ${accessToken}`);

    res.status(200).json({
      status: 'success',
      // accessToken,
    });
  });

  public getAllScannerUsers = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const scannerUser = await this.scannerUserService.getAllScannerUser(req, next);
    if (!scannerUser) return next(new AppError('No scannerUser found', 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { scannerUser },
    };
    res.status(200).json(successResponse);
  });

  public getScannerUserById = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { scannerUserId } = req.params;
    if (!scannerUserId) return next(new AppError('you must provide id for your request', 400));
    const scannerUser = await this.scannerUserService.getScannerUserById(req, next, Number(scannerUserId));
    if (!scannerUser) return next(new AppError(`scannerUser with ID ${scannerUserId} not found`, 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { scannerUser },
    };
    res.status(200).json(successResponse);
  });

  public getScannerUserProfile = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.scannerUserFromRequest) return next(new AppError('cannot find scanner in the context', 400));
    const scannerUserId = req.scannerUserFromRequest.id;
    if (!scannerUserId) return next(new AppError('you must provide id for your request', 400));
    const scannerUser = await this.scannerUserService.getScannerUserById(req, next, Number(scannerUserId));
    if (!scannerUser) return next(new AppError(`scannerUser with ID ${scannerUserId} not found`, 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { scannerUser },
    };
    res.status(200).json(successResponse);
  });

  public updateScannerUser = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const data = { ...req.body, id: Number(req.params.scannerUserId) };
    if (!req.originalUrl.startsWith('/api/dashboard')) {
      if (data.supervisorId !== undefined && Number(data.supervisorId) !== req.supervisorFromReq?.id)
        return next(new AppError(errorMessage('error.cannot update scanner user to other supervisor'), 400));
    }
    const updatedScannerUser = await this.scannerUserService.updatenewScannerUsername(req, next, data);
    if (!updatedScannerUser) return next(new AppError('scannerUser update failed', 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { updatedScannerUser },
    };
    res.status(200).json(successResponse);
  });

  public updateSupervisorPassword = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const supervisorId = req.supervisorFromReq?.id;
    const data: ChangeScannerPassword = { ...req.body, id: supervisorId };
    const changePassword = await this.scannerUserService.updateScannerUserPassword(data, next);
    if (!changePassword) return next(new AppError('cannot update password', 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { changePassword },
    };
    res.status(200).json(successResponse);
  });

  public deleteScannerUser = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { scannerUserId } = req.params;
    if (!req.originalUrl.startsWith('/api/dashboard')) {
      const owner: any = await this.scannerUserService.getScannerUserById(req, next, Number(scannerUserId));
      const ownerId = owner.supervisorId;
      if (ownerId && Number(ownerId) !== req.supervisorFromReq?.id)
        return next(new AppError(errorMessage('error.cannot delete scanner to other supervisor'), 400));
    }

    const result = await this.scannerUserService.deleteScannerUser(req, next, Number(scannerUserId));
    if (!result) return next(new AppError('Error deleting scannerUser', 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { message: {} },
    };
    res.status(204).json(successResponse);
  });

  public toggleActivateScannerUser = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const scannerId = Number(req.params.scannerUserId);
    if (!scannerId) return next(new AppError('missing scanner user Id', 400));
    const data = { scannerId };
    if (req.supervisorFromReq) Object.assign(data, { supervisorId: req.supervisorFromReq.id });
    const scannerUser = await scannerUserService.toggleActivateScannerUser(data, next);
    if (!scannerUser) return next(new AppError(errorMessage('error.scannerUserserNotRegistered'), 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { scannerUser },
    };
    res.status(200).json(successResponse);
  });

  public getAllEventsForScanner = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const scannerUserId = req.scannerUserFromRequest?.id;
    if (!scannerUserId) return next(new AppError('missing scannerUser id', 400));

    const events = await this.scannerUserService.getAllEventsForScanner(req, next, scannerUserId);

    if (!events) return next(new AppError('error happen while getting events', 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { events },
    };
    res.status(200).json(successResponse);
  });

  public uploadScannerUserImage = scannerUserService.uploadSingleImageForScannerUserService;

  public saveScannerUserPhoto = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.file) return next();
    await this.scannerUserService.saveScannerUserImageOnUpdate(req, next);
    next();
  });
}

export default new ScannerUserController(scannerUserService);
