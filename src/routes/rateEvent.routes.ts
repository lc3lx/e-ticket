import express, { Router } from 'express';
import RateEventController from '../controllers/rateEvent.controller';
import protect from '../middlewares/protectRoutes.middlware';
import userOnly from '../middlewares/authUserOnly.middleware';

const rateEventRouter: Router = express.Router();

rateEventRouter.use(protect);

rateEventRouter.post('/', userOnly, RateEventController.rateEvent);
rateEventRouter.route('/:eventId').get(RateEventController.getUserRating).delete(RateEventController.deleteRating);
rateEventRouter.get('/event/:eventId', RateEventController.getEventAverageRating);

export default rateEventRouter;
