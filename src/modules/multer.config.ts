import path from 'path';
import fs from 'fs';
import multer, { FileFilterCallback } from 'multer';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto.js';
import AppError from '../utils/AppError.js';
import { errorMessage } from '../modules/i18next.config';

const storage = multer.diskStorage({
  destination: (req: CustomRequest, file: Express.Multer.File, cb) => {
    let outputPath = '';
    const fieldName = file.fieldname;

    if (fieldName === 'profilePicture') outputPath = path.join(__dirname, '..', 'uploads', 'profile_pics');
    if (fieldName === 'mainPhoto') outputPath = path.join(__dirname, '..', 'uploads', 'events', 'main');
    if (fieldName === 'miniPoster') outputPath = path.join(__dirname, '..', 'uploads', 'events', 'miniPoster');
    if (fieldName === 'eventPhotos') outputPath = path.join(__dirname, '..', 'uploads', 'events', 'others');
    if (fieldName === 'workDocument') outputPath = path.join(__dirname, '..', 'uploads', 'workDocument');
    if (fieldName === 'agentPhoto') outputPath = path.join(__dirname, '..', 'uploads', 'agentPhoto');
    if (fieldName === 'scannerUserPhoto') outputPath = path.join(__dirname, '..', 'uploads', 'scannerUserPhoto');
    if (fieldName === 'paymentMethodLogo') outputPath = path.join(__dirname, '..', 'uploads', 'paymentMethodLogo');

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    cb(null, outputPath);
  },
  filename: (req: CustomRequest, file: Express.Multer.File, cb) => {
    const ext = '.jpeg';
    const eventName = req.body.eventName || 'event';
    const normalUserName = 'user';
    const fieldName = file.fieldname;
    const timestamp = Date.now();
    const userId = req.normalUserFromReq?.id;
    const supervisorName = req.body.userName || 'supervisor';
    const ServiceName = req.body.ServiceName || 'paymentMethod';

    let fileName = '';
    req.body.eventPhotos = [...(req.body.eventPhotos || [])];

    if (fieldName === 'mainPhoto') {
      fileName = `EventMainPhoto-${eventName}-${timestamp}${ext}`;
      req.body.mainPhoto = fileName;
    }

    if (fieldName === 'miniPoster') {
      fileName = `miniPoster-${eventName}-${timestamp}${ext}`;
      req.body.miniPoster = fileName;
    }
    if (fieldName === 'eventPhotos') {
      const counter = req.body.eventPhotos.length + 1;
      fileName = `EventPhotos-${eventName}-${timestamp}-${counter}${ext}`;
      req.body.eventPhotos.push(fileName);
    }
    if (fieldName === 'profilePicture') {
      fileName = `profilePicture-${normalUserName}-${userId}-${timestamp}${ext}`;
      req.body.profilePicture = fileName;
      delete req.body.eventPhotos;
    }
    if (fieldName === 'workDocument') {
      fileName = `workDocument-${supervisorName}-${timestamp}${ext}`;
      req.body.workDocument = fileName;
      delete req.body.eventPhotos;
    }
    if (fieldName === 'agentPhoto') {
      fileName = `agentPhoto-Agent-${timestamp}${ext}`;
      req.body.agentPhoto = fileName;
      delete req.body.eventPhotos;
    }
    if (fieldName === 'scannerUserPhoto') {
      fileName = `scannerUser-Scanner-${timestamp}${ext}`;
      req.body.scannerUserPhoto = fileName;
      delete req.body.eventPhotos;
    }
    if (fieldName === 'paymentMethodLogo') {
      fileName = `paymentMethod-${ServiceName}-${timestamp}${ext}`;
      req.body.paymentMethodLogo = fileName;
      delete req.body.eventPhotos;
    }
    cb(null, fileName);
  },
});

const fileFilter = (req: CustomRequest, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (file.mimetype.startsWith('image') && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(errorMessage('error.notImageFile'), 400));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;
