import { Response, NextFunction } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto.js';
import reportService from '../services/report.service.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { defaultSuccessResponse, DefaultSuccessResponse } from '../common/messages/en/default.response.js';

class ReportController {
  public getSupervisorReports = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const eventId = Number(req.params.eventId);
    const supervisorId = req.supervisorFromReq?.id;

    if (!supervisorId) return next(new AppError('Unauthorized', 401));

    const report = await reportService.getReportsForSupervisor({ supervisorId, eventId }, next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { report },
    };
    res.status(200).json(successResponse);
  });

  public getAdminUsersReport = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const data = { startDate: req.query.startDate as string, endDate: req.query.endDate as string };

    const report = await reportService.getUsersReportForAdmin(data, next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { report },
    };
    res.status(200).json(successResponse);
  });

  public getAdminTicketSoldReport = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const data = { startDate: req.query.startDate as string, endDate: req.query.endDate as string };

    const report = await reportService.getTicketSoldReportForAdmin(data, next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { report },
    };
    res.status(200).json(successResponse);
  });

  public getAdminMostTicketSoldReport = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const data = { startDate: req.query.startDate as string, endDate: req.query.endDate as string };

    const report = await reportService.getMostTicketSoldReportForAdmin(data, next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { report },
    };
    res.status(200).json(successResponse);
  });

  public getAdminCompletionRateReport = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const data = { startDate: req.query.startDate as string, endDate: req.query.endDate as string };

    const report = await reportService.getCompletionRateReportForAdmin(data, next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { report },
    };
    res.status(200).json(successResponse);
  });

  public getAdminActiveUsersReport = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const data = {};

    const report = await reportService.getActiveUsersReportForAdmin(data, next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { report },
    };
    res.status(200).json(successResponse);
  });

  public getTotalRevenueReport = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const data = { startDate: req.query.startDate as string, endDate: req.query.endDate as string };

    const report = await reportService.getTotalRevenueReportForAdmin(data, next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { report },
    };
    res.status(200).json(successResponse);
  });

  public getRevenueAnalysisReport = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const data = { startDate: req.query.startDate as string, endDate: req.query.endDate as string };

    const report = await reportService.getRevenueAnalysisReportForAdmin(data, next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { report },
    };
    res.status(200).json(successResponse);
  });
  public getPaymentMethodsReport = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const data = { startDate: req.query.startDate as string, endDate: req.query.endDate as string };

    const report = await reportService.getPaymentMethodsReportForAdmin(data, next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { report },
    };
    res.status(200).json(successResponse);
  });
}

export default new ReportController();
