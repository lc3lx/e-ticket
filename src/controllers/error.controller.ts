import {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
  ConnectionError,
  TimeoutError,
  BaseError,
} from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import AppError from '../utils/AppError.js';
import { errorMessage } from '../modules/i18next.config';
import logger from '../utils/logger';

// ---------------------- MASK SENSITIVE -----------------------
function maskSensitive(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitive);

  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (/(password|otp|token|secret|key|pin|code|Code,Otp|OTP)/i.test(k)) {
      out[k] = '*****';
    } else if (typeof v === 'object') {
      out[k] = maskSensitive(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ---------------------- FORMAT VALIDATION ERRORS -----------------------
function formatErrors(errors: Array<{ field: string; message: string }>): string {
  const errorObj = errors.reduce(
    (acc, error) => {
      if (
        ['provinces', 'eventTypeId', 'eventTypeIds', 'workType'].includes(error.field) &&
        error.message.startsWith('Invalid')
      ) {
        acc[error.field] = error.message;
      } else {
        acc[error.field] = errorMessage(`error.${error.message}`);
      }
      return acc;
    },
    {} as Record<string, string>,
  );
  return JSON.stringify(errorObj).replace(/"/g, "'").replace(/{/, '[').replace(/}/, ']');
}

// ---------------------- CUSTOM ERROR TYPES -----------------------
interface CustomError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

// ---------------------- ZOD ERRORS -----------------------
const handleZodError = (err: any) => {
  const unrecognizedKeys = err.errors.filter((e: any) => e.code === 'unrecognized_keys');
  if (unrecognizedKeys.length > 0) {
    const unexpectedErrorMessages = unrecognizedKeys.map((e: any) => ({
      field: 'unrecognizedKey',
      message: `Unexpected field(s): ${e.keys?.join(', ')}`,
    }));
    const msg = formatErrors(unexpectedErrorMessages);
    return new AppError(`Validation Error: ${msg}`, 400);
  }

  const errorMessages = err.errors.map((e: any) => ({
    field: e.path.join('.') || 'General',
    message: `${e.message}`,
  }));

  const msg = formatErrors(errorMessages);
  return new AppError(`Validation Error: ${msg}`, 400);
};

// ---------------------- JWT ERRORS -----------------------
const handleJWTError = () => new AppError(errorMessage('error.invalidToken'), 401);
const handleJWTExpiredError = () => new AppError(errorMessage('error.tokenExpired'), 401);

// ---------------------- SEQUELIZE ERRORS -----------------------
const handleSequelizeErrors = (err: Error) => {
  if (err instanceof ValidationError) {
    const messages = err.errors.map((e) => `${e.path}: ${errorMessage(`error.${e.message}`)}`);
    return new AppError(`Validation Error: [${messages.join(', ')}]`, 400);
  }
  if (err instanceof UniqueConstraintError) {
    const messages = err.errors.map((e) => `${e.path}: ${e.message || 'This value must be unique'}`);
    return new AppError(`Duplicate Entry: [${messages.join(', ')}]`, 400);
  }
  return err;
};

const handleSequelizeForeignKeyConstraintError = (err: ForeignKeyConstraintError) =>
  new AppError(`Foreign key constraint error: ${err.message}`, 400);

const handleSequelizeConnectionError = (err: ConnectionError) =>
  new AppError(`Database connection error: ${err.message}`, 500);

const handleSequelizeTimeoutError = (err: TimeoutError) =>
  new AppError(`Database request timeout. Please try again later: ${err.message}.`, 503);

const handleSequelizeTransactionError = (err: BaseError) =>
  new AppError(`Server Error, Base Error, Transaction failed: ${err.message}`, 500);

// ---------------------- PRODUCTION + DEV SENDERS -----------------------
const sendErrorDev = (error: CustomError, res: Response) => {
  console.log('Error Controller Dev Error Code 💥: ', error.statusCode);
  console.log('Error Controller Dev Error 💥:', error);
  res.status(error.statusCode || 500).json({
    status: error.status,
    error,
    message: error.message,
    stack: error.stack,
  });
};

const sendErrorProd = (error: CustomError, res: Response) => {
  if (error.isOperational) {
    return res.status(error.statusCode || 500).json({
      status: error.status,
      message: error.message,
    });
  }

  console.error('Error Production💥: ', error);
  res.status(500).json({
    status: 'Error',
    message: errorMessage('error.someThingWrong'),
  });
};

// ---------------------- MAIN ERROR HANDLER -----------------------
const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // ---------- LOG ERROR (BODY + QUERY + USER) ----------
  const maskedBody = maskSensitive(req.body);
  const maskedQuery = maskSensitive(req.query);

  logger.error(
    JSON.stringify(
      {
        error: err.message,
        statusCode: err.statusCode,
        method: req.method,
        url: req.originalUrl,
        body: maskedBody,
        query: maskedQuery,
        user:
          (req as any).normalUserFromReq?.mobileNumber ||
          (req as any).supervisorFromReq?.username ||
          (req as any).adminFromReq?.email ||
          (req as any).scannerUserFromRequest?.name ||
          'Unauthenticated',
      },
      null,
      2,
    ),
  );

  // ---------- ZOD / JWT / SEQUELIZE ----------
  if (err instanceof ZodError) err = handleZodError(err);
  if (err.name === 'JsonWebTokenError') err = handleJWTError();
  if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();
  if (err.name === 'SequelizeValidationError' || err instanceof UniqueConstraintError) err = handleSequelizeErrors(err);
  if (err instanceof ForeignKeyConstraintError) err = handleSequelizeForeignKeyConstraintError(err);
  if (err instanceof ConnectionError) err = handleSequelizeConnectionError(err);
  if (err instanceof TimeoutError) err = handleSequelizeTimeoutError(err);
  if (err instanceof BaseError) err = handleSequelizeTransactionError(err);

  // ---------- SEND RESPONSE ----------
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};

export default errorHandler;
