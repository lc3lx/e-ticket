import express, { Router } from 'express';
import scannerUserController from '../controllers/scannerUser.controller';
import protect from '../middlewares/protectRoutes.middlware';
import adminOrSupervisor from '../middlewares/adminOrSupervisorAuth.middleware';
import scannerUserOnly from '../middlewares/authScannerUserOnly.middleware';
import supervisorOnly from '../middlewares/supervisorAuthOnly.middleware';
import requirePrivilege from '../middlewares/restrictAdmin.middleware';
import AdminTypes from '../common/enums/adminTypes.enum';
import dashboardController from '../controllers/dashboard.controller';

const ScannerUserRouter: Router = express.Router();

ScannerUserRouter.post('/login', scannerUserController.scannerUserLogin);
ScannerUserRouter.post('/accessToken', scannerUserController.getGeneratedAccessToken);

ScannerUserRouter.use(protect);

ScannerUserRouter.get('/events', scannerUserOnly, scannerUserController.getAllEventsForScanner);
ScannerUserRouter.get('/me', scannerUserOnly, scannerUserController.getScannerUserProfile);

ScannerUserRouter.use(adminOrSupervisor);
ScannerUserRouter.use(requirePrivilege());

ScannerUserRouter.route('/').get(scannerUserController.getAllScannerUsers);

ScannerUserRouter.patch('/changePassword', supervisorOnly, scannerUserController.updateSupervisorPassword);

ScannerUserRouter.route('/:scannerUserId')
  .get(scannerUserController.getScannerUserById)
  .patch(
    dashboardController.dashboardLoggerMiddleware('UPDATE_SCANNER_USER'),
    scannerUserController.uploadScannerUserImage,
    scannerUserController.saveScannerUserPhoto,
    scannerUserController.updateScannerUser,
  )
  .delete(scannerUserController.deleteScannerUser);

ScannerUserRouter.get('/toggleActivate/:scannerUserId', scannerUserController.toggleActivateScannerUser);

export default ScannerUserRouter;
