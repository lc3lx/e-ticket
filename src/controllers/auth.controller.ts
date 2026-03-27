import { NextFunction, Request, Response } from 'express';
import authService, { AuthService } from '../services/auth.service.js';
import catchAsync from '../utils/catchAsync.js';
import { createSendToken, generateAccessToken, verifyToken } from '../modules/jwt.js';
import { RegisterUserDto } from '../interfaces/auth/registerUser.dto';
import { LoginUserDto } from '../interfaces/auth/loginUser.dto.js';
import {
  RegisterUserSuccessResponse,
  registerUserSuccessResponse,
} from '../common/messages/en/registerUser.response.js';
import { LoginUserSuccessResponse, loginUserSuccessResponse } from '../common/messages/en/loginUser.response.js';
import { NormalUserPayload } from '../interfaces/auth/payload.interface.js';
import AppError from '../utils/AppError.js';
import UserTypes from '../common/enums/userTypes.enum.js';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto.js';
import normalUserService from '../services/normalUser.service.js';
import { errorMessage } from '../modules/i18next.config';

class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  public register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data: RegisterUserDto = req.body;

    const register = await this.authService.register(data, next);

    if (!register) return;

    const registerSuccess: RegisterUserSuccessResponse = {
      ...registerUserSuccessResponse(),
    };

    res.status(201).json({
      registerSuccess,
      data: {
        register,
      },
    });
  });

  public login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userData: LoginUserDto = req.body;

    const normalUser = await this.authService.login(userData, next);
    if (!normalUser) return next(new AppError(errorMessage('error.phoneNumberNotCorrect'), 400));

    const loginSuccess: LoginUserSuccessResponse = {
      ...loginUserSuccessResponse(),
    };

    res.status(200).json({
      loginSuccess,
      data: {
        normalUser,
      },
    });
  });

  public getGeneratedAccessToken = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.body || !req.body.refreshToken) return next(new AppError('not valid body !', 400));
    const { refreshToken } = req.body;
    const verfiedToken = verifyToken(refreshToken);
    if (verfiedToken.iss !== 'normalUser') return next(new AppError('you cannot refresh your token', 401));
    const { mobileNumber } = verfiedToken.payload;

    if (!mobileNumber) return next(new AppError(errorMessage('error.phoneNumberNotValid'), 401));

    const mobileNumberFound = await normalUserService.findOneUser(mobileNumber, next);
    if (!mobileNumberFound) return next(new AppError(errorMessage('error.phoneNumberExist'), 404));
    const payload: NormalUserPayload = {
      userId: mobileNumberFound.userId,
      mobileNumber,
      issuer: UserTypes.NormalUser,
    };

    const accessToken = generateAccessToken(payload);
    if (accessToken) res.setHeader('Authorization', `Bearer ${accessToken}`);

    res.status(200).json({
      status: 'success',
      // accessToken,
    });
  });
}

export default new AuthController(authService);
