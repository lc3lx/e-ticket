import { NextFunction, Request, Response } from 'express';
import OTPService from '../services/OTP.service.js';
import catchAsync from '../utils/catchAsync.js';
import { defaultSuccessResponse, DefaultSuccessResponse } from '../common/messages/en/default.response.js';
import AppError from '../utils/AppError.js';
import OtpCode from '../models/OTPCode.model.js';
import UserTypes from '../common/enums/userTypes.enum.js';
import { NormalUserPayload, ScannerUserPayload, SupervisorPayload } from '../interfaces/auth/payload.interface.js';
import normalUserService from '../services/normalUser.service.js';
import { errorMessage } from '../modules/i18next.config.js';
import { createSendToken } from '../modules/jwt.js';
import supervisorService from '../services/supervisor.service.js';

class OTPController {
  public confirmOTP = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data: { mobileNumber: string; purpose: string; code: string } = req.body;

    const confirmOTPMessage = await OTPService.verifyOtp(data, next);

    if (!confirmOTPMessage) return next(new AppError('cannot send OTP Message.', 400));

    let accessToken: string | undefined;
    let refreshToken: string | undefined;

    if (data.purpose === 'signup' || data.purpose === 'login') {
      const normalUser = await normalUserService.getOneNormalUserByMobileNumber(data.mobileNumber);
      if (!normalUser) return next(new AppError(errorMessage('error.userNotFound'), 400));
      const payload: NormalUserPayload = {
        userId: normalUser.userId,
        mobileNumber: normalUser.mobileNumber,
        issuer: UserTypes.NormalUser,
      };

      ({ accessToken, refreshToken } = createSendToken(payload, res));
    } else if (
      data.purpose === 'supervisor_login' ||
      data.purpose === 'spervisor_password_reset' ||
      data.purpose === 'supervisor_forget_password'
    ) {
      const supervisor = await supervisorService.getOneSupervisorByMobileNumber(data.mobileNumber, next);

      if (!supervisor) return next(new AppError(errorMessage('error.supervisorNotFound'), 400));

      const payload: SupervisorPayload = {
        userId: supervisor.userId,
        username: supervisor.username,
        issuer: UserTypes.Supervisor,
      };
      ({ accessToken, refreshToken } = createSendToken(payload, res));
    } else if (data.purpose === 'scanner_password_reset') {
      const supervisor = await supervisorService.getOneSupervisorByMobileNumber(data.mobileNumber, next);

      if (!supervisor) return next(new AppError(errorMessage('error.supervisorNotFound'), 400));

      const payload: ScannerUserPayload = {
        userId: supervisor.scannerUser.id,
        name: supervisor.scannerUser.name,
        issuer: UserTypes.Scanner,
      };
      ({ accessToken, refreshToken } = createSendToken(payload, res));
    }

    res.setHeader('Authorization', `Bearer ${accessToken}`);
    if (refreshToken) res.setHeader('X-Refresh-Token', refreshToken);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { confirmOTPMessage },
    };
    res.status(200).json({ ...successResponse });
  });

  public getOTPStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { mobileNumber, purpose, username } = req.body;
    const data = { mobileNumber, purpose, username };

    const otpStatus = await OTPService.getOTPStatus(data, next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { otpStatus },
    };
    res.status(200).json(successResponse);
  });

  public resendCode = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { mobileNumber, purpose } = req.body;
    const data = { mobileNumber, purpose };

    const otpCode = await OTPService.resendOTP(data, next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { otpCode },
    };
    res.status(200).json(successResponse);
  });

  public getWhatsAppWebStatus = catchAsync(async (_req: Request, res: Response, next: NextFunction) => {
    const status = await OTPService.getWhatsAppWebStatus(next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { status },
    };
    res.status(200).json(successResponse);
  });

  public getWhatsAppQrImage = catchAsync(async (_req: Request, res: Response, next: NextFunction) => {
    const status = await OTPService.getWhatsAppWebStatus(next);
    const qrCode = status?.qrCode;

    if (!qrCode || typeof qrCode !== 'string' || !qrCode.startsWith('data:image/png;base64,')) {
      return next(new AppError('QR code is not available yet', 404));
    }

    const base64 = qrCode.replace('data:image/png;base64,', '');
    const imgBuffer = Buffer.from(base64, 'base64');

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(imgBuffer);
  });
}
export default new OTPController();
