import express, { Router } from 'express';
import ProvinceController from '../controllers/province.controller';

const ProvinceRouter: Router = express.Router();

ProvinceRouter.get('/', ProvinceController.getAllProvinces);

export default ProvinceRouter;
