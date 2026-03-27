import express, { Router } from 'express';
import otpController from '../controllers/otp.Controller';

const OtpRouter: Router = express.Router();

OtpRouter.post('/getOTPStatus', otpController.getOTPStatus);

OtpRouter.post('/confirmOTP', otpController.confirmOTP);

OtpRouter.post('/resendOTP', otpController.resendCode);

OtpRouter.get('/whatsapp/status', otpController.getWhatsAppWebStatus);
OtpRouter.get('/whatsapp/qr-image', otpController.getWhatsAppQrImage);

export default OtpRouter;
