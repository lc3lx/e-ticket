import express, { Router } from 'express';
import authController from '../controllers/auth.controller';

const AuthRouter: Router = express.Router();

AuthRouter.post('/signup', authController.register);

AuthRouter.post('/login', authController.login);

AuthRouter.post('/getAccessToken', authController.getGeneratedAccessToken);

export default AuthRouter;
