import { commonMessage } from '../../../modules/i18next.config';

export interface RegisterUserSuccessResponse {
  success: boolean;
  message: string;
}

export interface RegisterUserFailedResponse {
  success: boolean;
  message: string;
  error: string;
}

export const registerUserSuccessResponse = (): RegisterUserSuccessResponse => ({
  success: true,
  message: commonMessage('common.registerSuccess'),
});

export const registerUserFailedResponse: RegisterUserFailedResponse = {
  success: false,
  message: 'Please try again later.',
  error: 'There was an error while registering the user.',
};
