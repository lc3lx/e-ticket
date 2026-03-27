import { NextFunction, Request, Response } from 'express';
import { createSendToken, verifyToken, generateAccessToken } from '../modules/jwt.js';
import { AdminPayload } from '../interfaces/auth/payload.interface';
import UserTypes from '../common/enums/userTypes.enum';
import dashboardService, { DashboardService } from '../services/dashboard.service';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import { RegisterAdminDto } from '../interfaces/dashboard/registerAdmin.dto';
import {
  registerUserSuccessResponse,
  RegisterUserSuccessResponse,
} from '../common/messages/en/registerUser.response.js';
import { loginUserSuccessResponse, LoginUserSuccessResponse } from '../common/messages/en/loginUser.response.js';
import {
  UserSuccessResponse,
  userSuccessResponse,
  defaultUserSuccessResponse,
} from '../common/messages/en/normalUser.response.js';
import { errorMessage } from '../modules/i18next.config';
import AdminTypes from '../common/enums/adminTypes.enum.js';
import { logDashboardAction } from '../utils/dashboardLogger.js';

class DashboardController {
  private dashboardService: DashboardService;

  constructor(dashboardService: DashboardService) {
    this.dashboardService = dashboardService;
  }

  public register = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.body) return next(new AppError('there is no data to this request', 400));
    const adminData: RegisterAdminDto = req.body;

    if (req.adminFromReq?.role !== 'superadmin' && adminData.role === 'ceo')
      return next(new AppError(errorMessage('error.CannotCreateCEO'), 400));

    const admin = await this.dashboardService.register(adminData, next);

    if (!admin) return next(new AppError(errorMessage('error.emailExist'), 400));
    const payload: AdminPayload = {
      userId: admin.userId,
      email: admin.email,
      issuer: UserTypes.DashboardAdmin,
    };
    const { accessToken, refreshToken } = createSendToken(payload, res);

    const registerSuccess: RegisterUserSuccessResponse = {
      ...registerUserSuccessResponse(),
    };
    res.status(201).json({
      registerSuccess,
      accessToken,
      refreshToken,
      data: {
        admin,
      },
    });
  });

  public login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) return next(new AppError('there is no data to this request', 400));
    const adminData: RegisterAdminDto = req.body;

    const admin = await this.dashboardService.login(adminData, next);

    const payload: AdminPayload = {
      userId: admin.user.id,
      email: admin.email,
      issuer: UserTypes.DashboardAdmin,
    };
    const { accessToken, refreshToken } = createSendToken(payload, res);

    const loginSuccess: LoginUserSuccessResponse = {
      ...loginUserSuccessResponse(),
    };
    res.status(200).json({
      loginSuccess,
      accessToken,
      refreshToken,
      data: {
        admin,
      },
    });
  });

  public getGeneratedAccessToken = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.body || !req.body.refreshToken) return next(new AppError('not valid body !', 400));
    const { refreshToken } = req.body;
    const verfiedToken = verifyToken(refreshToken);
    if (verfiedToken.iss !== 'dashboard admin') return next(new AppError('you cannot refresh your token', 401));
    const { email } = verfiedToken.payload;

    if (!email) return next(new AppError(errorMessage('error.emailNotFound'), 404));

    const emailFound = await this.dashboardService.getOneAdmin(email, next);
    if (!emailFound) return next(new AppError(errorMessage('error.adminNotFound'), 404));
    const payload: AdminPayload = {
      userId: emailFound.userId,
      email,
      issuer: UserTypes.DashboardAdmin,
    };
    const accessToken = generateAccessToken(payload);
    res.status(200).json({
      status: 'success',
      accessToken,
    });
  });

  public getAdminProfile = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.adminFromReq)
      return next(new AppError('admin not found in request context or you are not logged in', 401));

    const email = req.adminFromReq?.email;

    const admin = await this.dashboardService.getAdminProfile(email, next);

    if (!admin) return next(new AppError(errorMessage('error.adminNotFound'), 404));

    const getAdminSuccessResponse: UserSuccessResponse = {
      ...defaultUserSuccessResponse(),
      message: userSuccessResponse.read,
    };
    res.status(200).json({
      getAdminSuccessResponse,

      data: {
        admin,
      },
    });
  });

  public updateAdminProfileInfo = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.adminFromReq)
      return next(new AppError('admin not found in request context or you are not logged in', 401));
    const email = req.adminFromReq?.email;

    const updatedAdmin = await this.dashboardService.updateAdminProfileInfo(email, req.body, next);
    if (!updatedAdmin) return next(new AppError(errorMessage('error.adminNotFound'), 404));

    const updateAdminSuccessResponse: UserSuccessResponse = {
      ...defaultUserSuccessResponse(),
      message: userSuccessResponse.update,
    };
    res.status(200).json({
      updateAdminSuccessResponse,

      data: {
        updatedAdmin,
      },
    });
  });

  public updateAdminInfo = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.adminFromReq)
      return next(new AppError('admin not found in request context or you are not logged in', 401));
    const id = Number(req.params.id);
    if (!id) return next(new AppError(errorMessage('error.adminIdRequired'), 401));

    const targetAdmin = await this.dashboardService.getOneAdminService(id, next);
    if (!targetAdmin) return next(new AppError(errorMessage('error.adminNotFound'), 404));

    if (req.adminFromReq.role === AdminTypes.CEO && targetAdmin.role === AdminTypes.CEO)
      return next(new AppError(errorMessage('error.CannotUpdateCEO'), 400));

    const updatedAdmin = await this.dashboardService.updateAdminInfo(id, req.body, next);
    if (!updatedAdmin) return next(new AppError(errorMessage('error.adminNotFound'), 404));

    const updateAdminSuccessResponse: UserSuccessResponse = {
      ...defaultUserSuccessResponse(),
      message: userSuccessResponse.update,
    };
    res.status(200).json({
      updateAdminSuccessResponse,

      data: {
        updatedAdmin,
      },
    });
  });

  public deleteAdmin = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.adminFromReq)
      return next(new AppError('admin not found in request context or you are not logged in', 401));
    const id = Number(req.params.id);
    if (!id) return next(new AppError(errorMessage('error.adminIdRequired'), 401));

    const targetAdmin = await this.dashboardService.getOneAdminService(id, next);
    if (!targetAdmin) return next(new AppError(errorMessage('error.adminNotFound'), 404));

    if (req.adminFromReq.id === targetAdmin.id)
      return next(new AppError(errorMessage('error.CannotDeleteYourAccount'), 400));

    if (req.adminFromReq.role === AdminTypes.CEO && targetAdmin.role === AdminTypes.CEO)
      return next(new AppError(errorMessage('error.CannotDeleteCEO'), 400));

    const deletedAdmin = await this.dashboardService.deleteAdmin(id, next);
    if (!deletedAdmin) return next(new AppError(errorMessage('error.adminNotFound'), 404));

    const deleteAdminSuccessResponse: UserSuccessResponse = {
      ...defaultUserSuccessResponse(),
      message: userSuccessResponse.delete,
    };
    res.status(204).json({
      deleteAdminSuccessResponse,
    });
  });

  public getAllAdmins = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const admins = await this.dashboardService.getAllAdminsAccount(req, next);
    if (!admins) return next(new AppError('something goes wrong, it must be 1 at least', 400));

    const getAllAdminsSuccessResponse: UserSuccessResponse = {
      ...defaultUserSuccessResponse(),
      message: userSuccessResponse.read,
    };
    res.status(200).json({
      getAllAdminsSuccessResponse,

      data: {
        admins,
      },
    });
  });

  public getAllAdminLogs = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const logs = await this.dashboardService.getAllAdminLogs(req, next);
    if (!logs) return next(new AppError('something goes wrong, it must be 1 at least', 400));

    const getAllAdminLogsSuccessResponse: UserSuccessResponse = {
      ...defaultUserSuccessResponse(),
      message: userSuccessResponse.read,
    };
    res.status(200).json({
      getAllAdminLogsSuccessResponse,

      data: {
        logs,
      },
    });
  });

  public getMainPageData = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const mainPageData = await this.dashboardService.getMainPageData(req, next);
    if (!mainPageData) return next(new AppError('something goes wrong, it must be 1 at least', 400));

    const getAllAdminLogsSuccessResponse: UserSuccessResponse = {
      ...defaultUserSuccessResponse(),
      message: userSuccessResponse.read,
    };
    res.status(200).json({
      getAllAdminLogsSuccessResponse,

      data: {
        mainPageData,
      },
    });
  });

  public blockANdNonBlockAdminAccount = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { adminId } = req.params;

    //TODO:translate
    if (Number(adminId) === req.adminFromReq?.id) return next(new AppError('you cannot block your account', 400));
    const blockToggle = await dashboardService.blockAndUnblockAdminAccount(Number(adminId), next);
    if (!blockToggle) return next(new AppError('Cannot found this account', 400));
    const successResponse: UserSuccessResponse = {
      ...defaultUserSuccessResponse(),
      message: userSuccessResponse.read,
    };
    res.status(200).json(successResponse);
  });

  public dashboardLoggerMiddleware =
    (actionName?: string) => async (req: CustomRequest, res: Response, next: NextFunction) => {
      try {
        const user = req.adminFromReq;
        if (!user) return next();

        await logDashboardAction({
          userName: user?.email,
          role: user?.role,
          action: actionName ?? 'unknown_action',
          url: req.originalUrl,
          method: req.method,
          data: req.body || null,
        });

        return next();
      } catch (err) {
        console.error('Failed to log dashboard action:', err);
        return next(); // never block user
      }
    };
}

export default new DashboardController(dashboardService);
