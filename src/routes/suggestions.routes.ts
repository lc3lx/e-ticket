import express, { Router } from 'express';
import SuggestionController from '../controllers/suggestions.controller';
import protect from '../middlewares/protectRoutes.middlware';
import authUserOnly from '../middlewares/authUserOnly.middleware';
import adminOnly from '../middlewares/adminOnly.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
// import AdminTypes from '../common/enums/adminTypes.enum';

const SuggestionRouter: Router = express.Router();

SuggestionRouter.use(protect);

SuggestionRouter.route('/').get(adminOnly, requirePrivilege(), SuggestionController.getAllSuggestions);
SuggestionRouter.route('/user/:userId').get(SuggestionController.getAllSuggestionsByUser);
SuggestionRouter.route('/event/:eventId').get(SuggestionController.getAllSuggestionsByEvent);

SuggestionRouter.use(authUserOnly);

SuggestionRouter.post('/', SuggestionController.createSuggestion);

export default SuggestionRouter;
