import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

const logDir = path.resolve(__dirname, '../../../logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const transport = new DailyRotateFile({
  dirname: logDir,
  filename: 'E-Tickets-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '120d',
  zippedArchive: true,
  // createSymlink: true,
  json: true,
});

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf((info: any) => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`),
  ),
  // transports: [new winston.transports.Console(), transport],
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
      consoleWarnLevels: ['warn'],
    }),
    transport,
  ],
});

export default logger;
