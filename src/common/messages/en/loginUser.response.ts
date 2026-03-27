import { commonMessage } from '../../../modules/i18next.config';

export interface LoginUserSuccessResponse {
  success: boolean;
  message: string;
}

export interface LoginUserFailedResponse {
  success: boolean;
  message: string;
  error: string;
}

export const loginUserSuccessResponse = (): LoginUserSuccessResponse => ({
  success: true,
  message: commonMessage('common.loginSuccess'),
});
