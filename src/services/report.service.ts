import { NextFunction } from 'express';
import { Sequelize } from 'sequelize';
import catchAsyncService from '../utils/catchAsyncService.js';
import AppError from '../utils/AppError.js';
import eventService from './event.service.js';
import ticketService from './ticket.service.js';
import normalUserService from './normalUser.service.js';
import bookTicketService from './bookTicket.service.js';
import { parseDateRange } from '../utils/dateRangeReport.js';

class ReportService {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public getReportsForSupervisor = catchAsyncService(async (data: { supervisorId: number; eventId: number }) => {
    const { supervisorId, eventId } = data;
    const ticketData = await ticketService.getTicketsReportForSupervisor(eventId, supervisorId);
    if (isNaN(eventId) && supervisorId) {
      // console.log('here');
      const events = await eventService.getFinanceSupervisorreportForAllEventsService(supervisorId);
      return { ticketData, events };
    }

    if (eventId && supervisorId) {
      // console.log('here 22');
      const event = await eventService.getFinanceSupervisorreportForEventService(supervisorId, eventId);
      return { ticketData, event };
    }
  });

  public getUsersReportForAdmin = catchAsyncService(
    async (data: { startDate?: string; endDate?: string }, next: NextFunction) => {
      const parsedRange = parseDateRange(data, next);
      if (!parsedRange) return;

      const users = await normalUserService.getAllNormalUserForAdminReport(parsedRange.startDate, parsedRange.endDate);

      return users;
    },
  );

  public getTicketSoldReportForAdmin = catchAsyncService(
    async (data: { startDate?: string; endDate?: string }, next: NextFunction) => {
      const parsedRange = parseDateRange(data, next);
      if (!parsedRange) return;

      const ticketSold = await bookTicketService.ticketsSoldReport(parsedRange.startDate, parsedRange.endDate);

      return ticketSold;
    },
  );

  public getMostTicketSoldReportForAdmin = catchAsyncService(
    async (data: { startDate?: string; endDate?: string }, next: NextFunction) => {
      const parsedRange = parseDateRange(data, next);
      if (!parsedRange) return;

      const ticketSold = await bookTicketService.getMostTicketsSales(parsedRange.startDate, parsedRange.endDate);

      return ticketSold;
    },
  );

  public getCompletionRateReportForAdmin = catchAsyncService(
    async (data: { startDate?: string; endDate?: string }, next: NextFunction) => {
      const parsedRange = parseDateRange(data, next);
      if (!parsedRange) return;

      const completionRate = await bookTicketService.completionRate(parsedRange.startDate, parsedRange.endDate);

      return completionRate;
    },
  );

  public getActiveUsersReportForAdmin = catchAsyncService(
    async (data: { startDate?: string; endDate?: string }, next: NextFunction) => {
      const activeUsers = await normalUserService.getAllUsersActiveForAdminReport();

      return activeUsers;
    },
  );

  public getTotalRevenueReportForAdmin = catchAsyncService(
    async (data: { startDate?: string; endDate?: string }, next: NextFunction) => {
      const parsedRange = parseDateRange(data, next);
      if (!parsedRange) return;

      const totalRevenue = await bookTicketService.totalRevenueReport(parsedRange.startDate, parsedRange.endDate);

      return totalRevenue;
    },
  );

  public getRevenueAnalysisReportForAdmin = catchAsyncService(
    async (data: { startDate?: string; endDate?: string }, next: NextFunction) => {
      const parsedRange = parseDateRange(data, next);
      if (!parsedRange) return;

      const revenueAnalysis = await bookTicketService.revenueAnalysis(parsedRange.startDate, parsedRange.endDate);

      return revenueAnalysis;
    },
  );

  public getPaymentMethodsReportForAdmin = catchAsyncService(
    async (data: { startDate?: string; endDate?: string }, next: NextFunction) => {
      const parsedRange = parseDateRange(data, next);
      if (!parsedRange) return;

      const paymentMethods = await bookTicketService.paymentMethodsReport(parsedRange.startDate, parsedRange.endDate);

      return paymentMethods;
    },
  );
}

import { sequelize } from '../DB/sequelize.js';
export default new ReportService(sequelize);
