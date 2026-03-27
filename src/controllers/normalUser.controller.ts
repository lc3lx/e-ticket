import { NextFunction, Response } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import { UpdateUserDto } from '../interfaces/normalUser/updateUser.dto';
import normalUserService, { NormalUserService } from '../services/normalUser.service';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import {
  defaultUserSuccessResponse,
  UserSuccessResponse,
  userSuccessResponse,
} from '../common/messages/en/normalUser.response';
import { errorMessage } from '../modules/i18next.config';
import { defaultSuccessResponse, DefaultSuccessResponse } from '../common/messages/en/default.response';

class NormalUserController {
  private normalUserService: NormalUserService;

  constructor(normalUserService: NormalUserService) {
    this.normalUserService = normalUserService;
  }

  public getAllUsers = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const users = await this.normalUserService.getAllUsers(req, next);
    if (!users) return next(new AppError(errorMessage('error.userNotFound'), 400));

    const getAllUsersSuccessResponse: UserSuccessResponse = {
      ...defaultUserSuccessResponse(),
      message: userSuccessResponse.read,
    };
    res.status(200).json({
      getAllUsersSuccessResponse,
      data: {
        users,
      },
    });
  });

  public getNormalUserProfile = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.normalUserFromReq) {
      return next(new AppError('User not found in request context or you are not logged in', 401));
    }
    const mobileNumber = req.normalUserFromReq?.mobileNumber;

    const normalUser = await this.normalUserService.getUserProfileInfo(mobileNumber!, next);
    if (!normalUser) return next(new AppError(errorMessage('error.userNotFound'), 404));

    const successResponse: UserSuccessResponse = {
      ...defaultUserSuccessResponse(),
      message: userSuccessResponse.read,
      data: { normalUser },
    };
    res.status(200).json(successResponse);
  });

  public updateNormalUserInfo = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.normalUserFromReq) {
      return next(new AppError('User not found in request context', 404));
    }
    const mobileNumber = req.normalUserFromReq?.mobileNumber;
    const data: UpdateUserDto = { ...req.body };

    const normalUser = await this.normalUserService.updateUserProfileInfo(mobileNumber!, data, next);
    if (!normalUser) return next(new AppError(errorMessage('error.userNotFound'), 404));

    const successResponse: UserSuccessResponse = {
      ...defaultUserSuccessResponse(),
      message: userSuccessResponse.update,
      data: { normalUser },
    };
    res.status(200).json(successResponse);
  });

  public getAllUsersBookedEvents = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = req.normalUserFromReq?.id;
    const events = await this.normalUserService.getAllEventForUser(req, next, Number(userId));

    if (!events) return next(new AppError(errorMessage('error.eventsNotFound'), 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { events },
    };
    res.status(200).json(successResponse);
  });

  public acceptRateAppNotification = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = Number(req.normalUserFromReq?.id);
    if (!userId) return next(new AppError(errorMessage('error.userNotFound'), 400));
    const userAccept = await this.normalUserService.acceptRateAppNotification(userId, next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { userAccept },
    };
    res.status(200).json(successResponse);
  });

  public uploadSingleImageForProfile = normalUserService.uploadSingleImageForProfileService;

  public resizeUserPhotoService = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.file) return next();

    await this.normalUserService.saveUserImageOnUpdate(req, next);

    next();
  });

  public blockANdNonBlockNormalUSerAccount = catchAsync(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
      const { normalUserId } = req.params;
      const blockToggle = await this.normalUserService.blockAndUnblockNormalUserAccount(Number(normalUserId), next);
      if (!blockToggle) return next(new AppError('Cannot found this account', 400));
      const successResponse: DefaultSuccessResponse = {
        ...defaultSuccessResponse(),
      };
      res.status(200).json(successResponse);
    },
  );
}

export default new NormalUserController(normalUserService);
