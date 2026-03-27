import jwt from 'jsonwebtoken';
import { Response } from 'express';
import dotenv from 'dotenv';
import {
  NormalUserPayload,
  AdminPayload,
  SupervisorPayload,
  ScannerUserPayload,
} from '../interfaces/auth/payload.interface';
import { errorMessage } from '../modules/i18next.config';

dotenv.config();

const secret: string = process.env.JWT_SECRET ?? '';

const signToken = (
  payload: NormalUserPayload | AdminPayload | SupervisorPayload | ScannerUserPayload,
  tokenExpiredIn: string,
) =>
  jwt.sign({ payload }, secret as jwt.Secret, {
    expiresIn: tokenExpiredIn as `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}`,
    issuer: payload.issuer,
  });

export const generateAccessToken = (
  payload: NormalUserPayload | AdminPayload | SupervisorPayload | ScannerUserPayload,
) => signToken(payload, process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '10h');

export const generateRefreshToken = (
  payload: NormalUserPayload | AdminPayload | SupervisorPayload | ScannerUserPayload,
) => signToken(payload, process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '1000d');

export const createSendToken = (
  payload: NormalUserPayload | AdminPayload | SupervisorPayload | ScannerUserPayload,
  res: Response,
) => {
  const accessToken = generateAccessToken(payload);

  const refreshToken = generateRefreshToken(payload);

  const cookieOptions = {
    expires: new Date(Date.now() + 1000 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: false,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwtRefresh', refreshToken, cookieOptions);
  res.cookie('jwtAccess', accessToken, cookieOptions);

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, secret) as NormalUserPayload &
      AdminPayload &
      SupervisorPayload &
      ScannerUserPayload;
    if (decoded.iss === 'normalUser') {
      return decoded as NormalUserPayload;
    }
    if (decoded.iss === 'dashboard admin') {
      return decoded as AdminPayload;
    }
    if (decoded.iss === 'supervisor') {
      return decoded as SupervisorPayload;
    }
    if (decoded.iss === 'scanner') {
      return decoded as ScannerUserPayload;
    }
    throw new Error(errorMessage('error.invalidTokenIssuer'));
  } catch (error: Error | unknown) {
    throw new Error((error as Error).message, { cause: error });
  }
};
