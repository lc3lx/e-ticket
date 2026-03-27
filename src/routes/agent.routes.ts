import express, { Router } from 'express';
import agentController from '../controllers/agent.controller';
import protect from '../middlewares/protectRoutes.middlware';
import authAdminOnly from '../middlewares/adminOnly.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import AdminTypes from '../common/enums/adminTypes.enum';
import dashboardController from '../controllers/dashboard.controller';

const AgentRouter: Router = express.Router();

AgentRouter.use(protect);

AgentRouter.route('/')
  .get(dashboardController.dashboardLoggerMiddleware('GET_ALL_AGENTS'), agentController.getAllAgents)
  .post(
    authAdminOnly,
    requirePrivilege(),
    dashboardController.dashboardLoggerMiddleware('CREATE_AGENT'),
    agentController.uploadAgentImage,
    agentController.saveAgentPhoto,
    agentController.createAgent,
  );
AgentRouter.route('/:agentId')
  .get(dashboardController.dashboardLoggerMiddleware('GET_AGENT'), agentController.getAgent)
  .patch(
    authAdminOnly,
    requirePrivilege(),
    dashboardController.dashboardLoggerMiddleware('UPDATE_AGENT'),
    agentController.uploadAgentImage,
    agentController.saveAgentPhoto,
    agentController.updateAgent,
  )
  .delete(
    authAdminOnly,
    requirePrivilege(),
    dashboardController.dashboardLoggerMiddleware('DELETE_AGENT'),
    agentController.deleteAgent,
  );

export default AgentRouter;
