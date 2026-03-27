import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import commonMessagesEn from '../common/messages/en/common.json';
import errorsMessagesEn from '../common/messages/en/errors.json';
import commonMessagesAn from '../common/messages/ar/common.json';
import errorsMessagesAr from '../common/messages/ar/errors.json';

export const initI18n = () => {
  i18next.use(Backend).init({
    lng: 'en',
    fallbackLng: 'en',
    saveMissing: true,
    backend: {
      loadPath: join(__dirname, '..', 'common', 'messages', '/{{lng}}/{{ns}}.json'),
    },
    preload: ['en', 'ar'],
    ns: ['common', 'errors'],
    defaultNS: 'common',
    // debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'header'],
      lookupQuerystring: 'lang',
      caches: false,
    },
  });
};

export const languageMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const lang = req.headers['accept-language']?.split(',')[0] || 'en';
  i18next.changeLanguage(lang);
  next();
};

export const errorMessage = (errMessage: string, options?: any) =>
  i18next.t(errMessage, { lng: i18next.language, ns: 'errors', ...options }) as string;
export const commonMessage = (commMessage: string, options?: any) =>
  i18next.t(commMessage, { lng: i18next.language, ns: 'common', ...options }) as string;
