import express, { Router } from 'express';
import protect from '../middlewares/protectRoutes.middlware';
import authAdminOnly from '../middlewares/adminOnly.middleware';
import dashboardController from '../controllers/dashboard.controller';
import ComplainRouter from './complain.routes';
import SuggestionRouter from './suggestions.routes';
import FavouriteActivityRouter from './favourite.routes';
import EventTypeRouter from './eventType.routes';
import ComplainTypeRouter from './complainType.routes';
import EventRouter from './event.routes';
import SupervisorRouter from './supervisor.routes';
import MessageRouter from './message.routes';
import RequestRouter from './request.routes';
import FAQRouter from './FAQ.routes';
import NormalUserRouter from './normalUser.routes';
import ScannerUserRouter from './scannerUser.routes';
import TicketRouter from './ticket.routes';
import BookingRouter from './bookTicket.routes';
import DiscountRouter from './discount.routes';
import AgentRouter from './agent.routes';
import pushRouter from './push.routes';
import TermsAndConditionRouter from './termsAndCondition.routes';
import PrivacyPolicyRouter from './privacyPolicy.routes';
import AboutUsRouter from './aboutUs.routes';
import NotificationRouter from './notification.routes';
import AllPaymentRouter from './allPayment.routes';
import MTNEPaymentRouter from './MTNEPayment.routes';
import ReportRouter from './report.routes';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
// import AdminTypes from '../common/enums/adminTypes.enum';

const DashBoardRouter: Router = express.Router();

// DashBoardRouter.use(logDashboardAction);

DashBoardRouter.post(
  '/admin/signup',
  protect,
  authAdminOnly,
  requirePrivilege(),
  dashboardController.dashboardLoggerMiddleware('CREATE_ADMIN'),
  dashboardController.register,
);
DashBoardRouter.post('/admin/login', dashboardController.login);
DashBoardRouter.post('/admin/getAccessToken', dashboardController.getGeneratedAccessToken);

DashBoardRouter.use('/admin/complainTypes', ComplainTypeRouter);
DashBoardRouter.use('/admin/eventTypes', EventTypeRouter);
DashBoardRouter.use('/admin/complains', ComplainRouter);
DashBoardRouter.use('/admin/suggestions', SuggestionRouter);
DashBoardRouter.use('/admin/favourites', FavouriteActivityRouter);
DashBoardRouter.use('/admin/favourites', FavouriteActivityRouter);
DashBoardRouter.use('/admin/favourites', FavouriteActivityRouter);
DashBoardRouter.use('/admin/event', EventRouter);
DashBoardRouter.use('/admin/supervisors', SupervisorRouter);
DashBoardRouter.use('/admin/getAllNormalUsers', NormalUserRouter);
DashBoardRouter.use('/admin/scannerUser', ScannerUserRouter);
DashBoardRouter.use('/admin/bookTicket', BookingRouter);
DashBoardRouter.use('/admin/ticket', TicketRouter);
DashBoardRouter.use('/admin/discount', DiscountRouter);
DashBoardRouter.use('/admin/agent/', AgentRouter);
DashBoardRouter.use('/admin/messages', MessageRouter);
DashBoardRouter.use('/admin/requests', RequestRouter);
DashBoardRouter.use('/admin/FAQs', FAQRouter);
DashBoardRouter.use('/admin/push', pushRouter);
DashBoardRouter.use('/admin/termsAndCondition', TermsAndConditionRouter);
DashBoardRouter.use('/admin/privacyPolicy', PrivacyPolicyRouter);
DashBoardRouter.use('/admin/aboutUs', AboutUsRouter);
DashBoardRouter.use('/admin/notification', NotificationRouter);
DashBoardRouter.use('/admin/allPayment', AllPaymentRouter);
DashBoardRouter.use('/admin/MTNEPayment', MTNEPaymentRouter);
DashBoardRouter.use('/admin/report', ReportRouter);

DashBoardRouter.use(protect);
DashBoardRouter.use(authAdminOnly);

DashBoardRouter.get(
  '/admin/getAllAdmins',
  requirePrivilege(),
  dashboardController.dashboardLoggerMiddleware('GET_ALL_ADMINS'),
  dashboardController.getAllAdmins,
);
DashBoardRouter.get('/admin/getMe', dashboardController.getAdminProfile);
DashBoardRouter.patch('/admin/updateMe', dashboardController.updateAdminProfileInfo);
DashBoardRouter.patch(
  '/admin/update/:id',
  requirePrivilege(),
  dashboardController.dashboardLoggerMiddleware('UPDATE_ADMIN'),
  dashboardController.updateAdminInfo,
);
DashBoardRouter.delete(
  '/admin/delete/:id',
  requirePrivilege(),
  dashboardController.dashboardLoggerMiddleware('DELETE_ADMIN'),
  dashboardController.deleteAdmin,
);
DashBoardRouter.get('/admin/mainPage', protect, dashboardController.getMainPageData);
DashBoardRouter.get(
  '/admin/blockAccount/:adminId',
  requirePrivilege(),
  dashboardController.dashboardLoggerMiddleware('BLOCK/UNBLOCK_ADMIN'),
  dashboardController.blockANdNonBlockAdminAccount,
);
DashBoardRouter.get('/admin/logs', protect, requirePrivilege(), dashboardController.getAllAdminLogs);

export default DashBoardRouter;
