/* eslint-disable import/prefer-default-export */

import AdminTypes from '../../common/enums/adminTypes.enum';

export class UpdateAdminInfoDto {
  firstName?: string;

  lastName?: string;

  oldPassword?: string;

  password?: string;

  passwordConfirm?: string;

  role?: AdminTypes;
}
