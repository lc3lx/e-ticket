import { commonMessage } from '../../../modules/i18next.config';

export interface UserSuccessResponse {
  success: boolean;
  message: string;
  data?: object;
}

export interface UserFailedResponse {
  success: boolean;
  message: string;
  error?: string;
}

export const userSuccessResponse = {
  create: commonMessage('common.createUser'),
  read: commonMessage('common.readUser'),
  update: commonMessage('common.updateUser'),
  delete: commonMessage('common.deleteUser'),
  sort: commonMessage('common.sortUser'),
  upload: commonMessage('common.uploadUser'),
};

export const userFailedResponse = {
  create: 'Failed to create user.',
  read: 'Failed to retrieve user data.',
  update: 'Failed to update user.',
  delete: 'Failed to delete user.',
  sort: 'Failed to sort users.',
  upload: 'Failed to upload user picture.',
};

export const defaultUserSuccessResponse = (): UserSuccessResponse => ({
  success: true,
  message: '',
});

export const defaultUserFailedResponse: UserFailedResponse = {
  success: false,
  message: '',
  error: '',
};

// export const loginUserSuccessResponse = (): LoginUserSuccessResponse => ({
//   success: true,
//   message: commonMessage('common.loginSuccess'),
// });
