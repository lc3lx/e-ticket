import express, { Express } from 'express';
import path from 'path';
import { originHandler } from './middlewares/cors.middleware';
import { xssSanitizer } from './middlewares/xss';
import { publicLimiter, adminLimiter } from './middlewares/rateLimiter.middleware';
import requestIp from 'request-ip';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { initI18n, languageMiddleware, errorMessage } from './modules/i18next.config';
import AppError from './utils/AppError.js';
import MainRouter from './routes/index.js';
import OtpRouter from './routes/otp.routes.js';
import globalErrorHandler from './controllers/error.controller.js';
import { requestLogger } from './middlewares/requestLogger.middleware';

const app: Express = express();

// app.set('trust proxy', 1);

app.use(helmet());
app.use(helmet.crossOriginOpenerPolicy({ policy: 'unsafe-none' }));
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

app.use(originHandler);

app.use(requestIp.mw());

app.use(bodyParser.json({ limit: '100kb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '100kb' }));

app.use(express.static(path.join(__dirname, 'uploads')));

app.use(cookieParser());

app.use(xssSanitizer);

// app.use('/api/dashboard', adminLimiter);
// app.use('/api', publicLimiter);

app.use(requestLogger);

initI18n();
app.use(languageMiddleware);

app.use('/api', MainRouter);
app.use('/otp', OtpRouter);

app.all('*', (req, res, next) => {
  next(new AppError(errorMessage('error.pageNotFound'), 404));
});

app.use(globalErrorHandler);

export default app;
