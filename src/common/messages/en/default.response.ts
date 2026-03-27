import { commonMessage } from '../../../modules/i18next.config';

export interface DefaultSuccessResponse {
  success: boolean;
  message: string;
  data?: object;
}

export interface DefaultFailedResponse {
  success: boolean;
  message: string;
  error: string;
}

export const defaultSuccessResponse = (): DefaultSuccessResponse => ({
  success: true,
  message: commonMessage('common.taskDone'),
});

export const defaultFailedResponse = (): DefaultFailedResponse => ({
  success: false,
  message: 'Please try again later.',
  error: 'There was an error while do this task',
});
