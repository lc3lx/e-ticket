import { NextFunction, Request, Response } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import { createSendToken, verifyToken, generateAccessToken } from '../modules/jwt.js';
import UserTypes from '../common/enums/userTypes.enum';
import supervisorService, { SupervisorService } from '../services/supervisor.service.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { RegisterSupervisorDto } from '../interfaces/supervisor/registerSupervisor.dto.js';
import {
  registerUserSuccessResponse,
  RegisterUserSuccessResponse,
} from '../common/messages/en/registerUser.response.js';
import { loginUserSuccessResponse, LoginUserSuccessResponse } from '../common/messages/en/loginUser.response.js';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response.js';
import { errorMessage } from '../modules/i18next.config';
import { SupervisorPayload } from '../interfaces/auth/payload.interface.js';
import { UpdateSupervisorDto } from '../interfaces/supervisor/updateSupervisor.dto';
import { ChangeSupervisorPassword } from '../interfaces/supervisor/changePassword.dto';
import { LoginSupervisorDto } from '../interfaces/supervisor/loginSupervisor.dto';
import { ForgetSupervisorPassword } from '../interfaces/supervisor/resetPassword.dto';

class SupervisorController {
  private supervisorService: SupervisorService;

  constructor(supervisorService: SupervisorService) {
    this.supervisorService = supervisorService;
  }

  public register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) return next(new AppError(errorMessage('error.supervisorEmptyBody'), 400));
    const supervisorData: RegisterSupervisorDto = req.body;

    const supervisor = await this.supervisorService.register(supervisorData, next);

    const payload: SupervisorPayload = {
      userId: supervisor.userId,
      username: supervisor.username,
      issuer: UserTypes.Supervisor,
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
        supervisor,
      },
    });
  });

  public login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) return next(new AppError('there is no data to this request', 400));
    const supervisorData: LoginSupervisorDto = req.body;

    const supervisor = await this.supervisorService.login(supervisorData, next);
    if (!supervisor) return next(new AppError(errorMessage('error.supervisorEmptyBody'), 400));

    // const payload: SupervisorPayload = {
    //   userId: supervisor.userId,
    //   username: supervisor.username,
    //   issuer: UserTypes.Supervisor,
    // };
    // const { accessToken, refreshToken } = createSendToken(payload, res);

    const loginSuccess: LoginUserSuccessResponse = {
      ...loginUserSuccessResponse(),
    };
    res.status(200).json({
      loginSuccess,
      // accessToken,
      // refreshToken,
      data: {
        supervisor,
      },
    });
  });

  public getGeneratedAccessToken = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.body || !req.body.refreshToken) return next(new AppError('not valid body !', 400));
    const { refreshToken } = req.body;
    const verfiedToken = verifyToken(refreshToken);
    if (verfiedToken.iss !== 'supervisor') return next(new AppError('you cannot refresh your token', 401));
    const { username } = verfiedToken.payload;

    if (!username) return next(new AppError(errorMessage('error.'), 401));

    const usernameFound = await this.supervisorService.getOneSupervisor(username, next);
    if (!usernameFound) return next(new AppError(errorMessage('error.adminNotFound'), 404));
    if (usernameFound.blocked) {
      // await transaction.rollback();
      return next(new AppError(errorMessage('error.blockedAccount'), 404));
    }
    const payload: SupervisorPayload = {
      userId: usernameFound.userId,
      username,
      issuer: UserTypes.Supervisor,
    };
    const accessToken = generateAccessToken(payload);
    if (accessToken) res.setHeader('Authorization', `Bearer ${accessToken}`);

    res.status(200).json({
      status: 'success',
      // accessToken,
    });
  });

  public getAllSupervisors = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const allSupervisors = await this.supervisorService.getAllSupervisor(req, next);
    if (!allSupervisors) return next(new AppError(errorMessage('error.getAllSupervisors'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { allSupervisors },
    };
    res.status(200).json(successResponse);
  });

  public getOneSupervisor = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const Supervisor = await this.supervisorService.getOneSupervisorById(Number(req.params.supervisorId), next);
    if (!Supervisor) return next(new AppError(errorMessage('error.getSupervisor'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { Supervisor },
    };
    res.status(200).json(successResponse);
  });

  public getSupervisorProfile = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const supervisorId = req.supervisorFromReq?.id || req.body.supervisorId;
    const Supervisor = await this.supervisorService.getSupervisorProfileInfo(supervisorId, next);
    if (!Supervisor) return next(new AppError(errorMessage('error.getSupervisor'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { Supervisor },
    };
    res.status(200).json(successResponse);
  });

  public updateSupervisorFromAdmin = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { supervisorId } = req.params;
    const data: UpdateSupervisorDto = { ...req.body, supervisorId };
    const updatedSupervisor = await this.supervisorService.updateSupervisorInfoFromAdmin(data, next);
    if (!updatedSupervisor) return next(new AppError('cannot submit update profile request', 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { updatedSupervisor },
    };
    res.status(200).json(successResponse);
  });

  public submitSupervisorUpdateProfileRequest = catchAsync(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
      const supervisorId = req.supervisorFromReq?.id;
      const userId = req.supervisorFromReq?.userId;
      const data: UpdateSupervisorDto = { ...req.body, supervisorId, userId };
      const submitedRequest = await this.supervisorService.updateMe(data, next);
      if (!submitedRequest) return next(new AppError('cannot submit update profile request', 400));

      const successResponse: DefaultSuccessResponse = {
        ...defaultSuccessResponse(),
        data: { submitedRequest },
      };
      res.status(200).json(successResponse);
    },
  );

  public updateSupervisorPassword = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const supervisorId = req.supervisorFromReq?.id;
    const data: ChangeSupervisorPassword = { ...req.body, supervisorId };
    const changePassword = await this.supervisorService.updateSupervisorPassword(data, next);
    if (!changePassword) return next(new AppError('cannot update password', 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { changePassword },
    };
    res.status(200).json(successResponse);
  });

  public forgetSupervisorPassword = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    // const supervisorId = req.supervisorFromReq?.id;
    const data: ForgetSupervisorPassword = { ...req.body };
    const newPassword = await this.supervisorService.forgetSupervisorPassword(data, next);
    if (!newPassword) return next(new AppError('cannot update password', 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { newPassword },
    };
    res.status(200).json(successResponse);
  });

  public getAllUpdateSupervisorProfileRequests = catchAsync(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
      const allSubmitedRequests = await this.supervisorService.getAllUpdateSupervisorsRequestsService(req, next);

      if (!allSubmitedRequests) return next(new AppError('cannot find update profile requests', 400));

      const successResponse: DefaultSuccessResponse = {
        ...defaultSuccessResponse(),
        data: { allSubmitedRequests },
      };
      res.status(200).json(successResponse);
    },
  );

  public approveUpdateProfileRequest = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { supervisorId } = req.body;
    if (!supervisorId) return next(new AppError('cannot approve any request without supervisorId', 400));
    const isApproved = await this.supervisorService.approveupdateSupervisorFromAdmin(supervisorId, next);
    if (!isApproved) return next(new AppError('error happening while approving updates', 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
    };
    res.status(200).json(successResponse);
  });

  public rejectUpdateProfileRequest = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { supervisorId } = req.body;
    const isRejected = await this.supervisorService.rejectupdateSupervisorFromAdmin(supervisorId, next);
    if (!isRejected) return next(new AppError('error happening while Rejecting updates', 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
    };
    res.status(200).json(successResponse);
  });

  public deactivateSupervisorAccount = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const supervisorId = req.originalUrl.split('/').includes('admin')
      ? req.params.supervisorId
      : req.supervisorFromReq?.id;
    const isDeactivated = await this.supervisorService.deactivateSupervisorAccount(Number(supervisorId), next);
    if (!isDeactivated) return next(new AppError('Cannot deactivate this account', 400));
    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
    };
    res.status(200).json(successResponse);
  });

  public activateSupervisorAccount = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const supervisorId = req.originalUrl.split('/').includes('admin')
      ? req.params.supervisorId
      : req.supervisorFromReq?.id;
    const isActivated = await this.supervisorService.activateSupervisorAccount(Number(supervisorId), next);
    if (!isActivated) return next(new AppError('Cannot activate this account', 400));
    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
    };
    res.status(200).json(successResponse);
  });

  public deleteSupervisorAccount = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    let deleteAccountRequest;
    const supervisorId = req.originalUrl.split('/').includes('admin')
      ? req.params.supervisorId
      : req.supervisorFromReq?.id;
    if (req.originalUrl.split('/').includes('admin')) {
      deleteAccountRequest = await this.supervisorService.deleteSupervisorAccountFromAdmin(Number(supervisorId), next);
      if (!deleteAccountRequest) return next(new AppError('Cannot delete this account', 400));
      res.status(204).json();
    } else {
      deleteAccountRequest = await this.supervisorService.deleteSupervisorAccountRequest(Number(supervisorId), next);
      if (!deleteAccountRequest) return next(new AppError('Cannot delete this account', 400));
      const successResponse: DefaultSuccessResponse = {
        ...defaultSuccessResponse(),
        data: deleteAccountRequest,
      };
      res.status(200).json(successResponse);
    }
  });

  public acceptDeleteAccountRequest = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { supervisorId } = req.params;
    const acceptDelete = await this.supervisorService.AcceptDeleteSupervisorAccount(Number(supervisorId), next);
    if (!acceptDelete) return next(new AppError('Cannot find this account to delete', 404));
    res.status(204).json();
  });

  public blockSupervisorAccount = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { supervisorId } = req.params;
    const blockToggle = await this.supervisorService.blockAndUnblockSupervisorAccount(Number(supervisorId), next);
    if (!blockToggle) return next(new AppError('Cannot found this account', 400));
    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
    };
    res.status(200).json(successResponse);
  });

  public acceptRateAppNotification = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const supervisorId = Number(req.supervisorFromReq?.id);
    if (!supervisorId) return next(new AppError(errorMessage('error.supervisorNotFound'), 400));
    const supervisorAccept = await this.supervisorService.acceptRateAppNotification(supervisorId, next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { supervisorAccept },
    };
    res.status(200).json(successResponse);
  });

  public uploadWorkDocument = supervisorService.uploadWorkDocumentService;

  public saveWorkDocument = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.file) return next();

    await this.supervisorService.saveSupervisorWorkDocumentService(req, next);

    next();
  });
}

export default new SupervisorController(supervisorService);
