// src/services/dashboardLoggerService.ts
import DashboardLog, { DashboardLogAttributes } from '../models/dashboardLogs.model';

export async function logDashboardAction(payload: {
  userName?: string;
  role?: string;
  action: string;
  url: string;
  method: string;
  data?: object;
}) {
  return DashboardLog.create(payload);
}
