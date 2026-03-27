import { Request as ExpressRequest } from 'express';
// import { File } from 'multer'; // Use the multer File type
import NormalUser from '../../models/normalUser.model';
import DashboardAdmin from '../../models/dashboardAdmin.model';
import { Supervisor } from '../../models/supervisor.model';
import ScannerUser from '../../models/scannerUser.model';

export interface CustomRequest extends ExpressRequest {
  normalUserFromReq?: NormalUser;
  adminFromReq?: DashboardAdmin;
  supervisorFromReq?: Supervisor;
  scannerUserFromRequest?: ScannerUser;
  notificationUser?: number;

  // files?: {
  //   [fieldname: string]: File[];
  // };
}
