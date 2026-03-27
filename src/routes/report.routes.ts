import express, { Router } from 'express';
import reportController from '../controllers/report.controller';
import protect from '../middlewares/protectRoutes.middlware';
import adminOnly from '../middlewares/adminOnly.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import AdminTypes from '../common/enums/adminTypes.enum';
import supervisorOnly from '../middlewares/supervisorAuthOnly.middleware';
import dashboardController from '../controllers/dashboard.controller';

const ReportRouter: Router = express.Router();

ReportRouter.use(protect);

ReportRouter.get(
  '/paymentMethods',
  adminOnly,
  requirePrivilege(AdminTypes.CFO),
  reportController.getPaymentMethodsReport,
);
ReportRouter.get('/totalRevenue', adminOnly, requirePrivilege(AdminTypes.CFO), reportController.getTotalRevenueReport);

ReportRouter.get(
  '/users',
  adminOnly,
  requirePrivilege(AdminTypes.CFO),
  dashboardController.dashboardLoggerMiddleware('DOWNLOAD_USERS_REPORT'),
  reportController.getAdminUsersReport,
);
ReportRouter.get(
  '/activeUsers',
  adminOnly,
  requirePrivilege(AdminTypes.CFO),
  dashboardController.dashboardLoggerMiddleware('DOWNLOAD_ACTIVE_USERS_REPORT'),
  reportController.getAdminActiveUsersReport,
);
ReportRouter.get(
  '/ticketsSold',
  adminOnly,
  requirePrivilege(AdminTypes.CFO),
  dashboardController.dashboardLoggerMiddleware('DOWNLOAD_TICKETS_SOLD_REPORT'),
  reportController.getAdminTicketSoldReport,
);
ReportRouter.get(
  '/mostTicketsSold',
  adminOnly,
  requirePrivilege(AdminTypes.CFO),
  dashboardController.dashboardLoggerMiddleware('DOWNLOAD_MOST_TICKETS_SOLD_REPORT'),
  reportController.getAdminMostTicketSoldReport,
);
ReportRouter.get(
  '/completionRate',
  adminOnly,
  requirePrivilege(AdminTypes.CFO),
  dashboardController.dashboardLoggerMiddleware('DOWNLOAD_COMPLATION_REPORT'),
  reportController.getAdminCompletionRateReport,
);
ReportRouter.get(
  '/revenueAnalysis',
  adminOnly,
  requirePrivilege(AdminTypes.CFO),
  dashboardController.dashboardLoggerMiddleware('DOWNLOAD_REVENUE_REPORT'),
  reportController.getRevenueAnalysisReport,
);

ReportRouter.get('/:eventId', supervisorOnly, reportController.getSupervisorReports);

export default ReportRouter;
