import express, { Router } from 'express';
import FavouriteController from '../controllers/Favourite.controller';
import protect from '../middlewares/protectRoutes.middlware';
import authUserOnly from '../middlewares/authUserOnly.middleware';

const FavouriteActivityRouter: Router = express.Router();

FavouriteActivityRouter.use(protect);

FavouriteActivityRouter.get('/', FavouriteController.getAllFavourite);
FavouriteActivityRouter.get('/user/:userId', FavouriteController.getAllFavouriteByUser);
FavouriteActivityRouter.get('/event/:eventId', FavouriteController.getAllFavouriteGroupped);
FavouriteActivityRouter.get('/isFavourite/event/:eventId', FavouriteController.checkFavourite);

FavouriteActivityRouter.use(authUserOnly);

FavouriteActivityRouter.route('/')
  .post(FavouriteController.createFavourite)
  .delete(FavouriteController.deleteFavourite);
FavouriteActivityRouter.get('/user', FavouriteController.getAllFavouriteByUser);

export default FavouriteActivityRouter;
