import express, { Router } from 'express';
import SyriatelEPayment from '../controllers/SyriatelEPayment.controller';
import protect from '../middlewares/protectRoutes.middlware';
import adminOnly from '../middlewares/adminOnly.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
// import AdminTypes from '../common/enums/adminTypes.enum';

const SyriatelEPaymentRouter: Router = express.Router();

SyriatelEPaymentRouter.use(protect);
SyriatelEPaymentRouter.use(adminOnly);
SyriatelEPaymentRouter.use(requirePrivilege());

SyriatelEPaymentRouter.get('/', SyriatelEPayment.getAllSyriatelEPayment);

export default SyriatelEPaymentRouter;
