/* eslint-disable import/prefer-default-export */
import AdminTypes from '../../common/enums/adminTypes.enum';

export class RegisterAdminDto {
  email!: string;

  firstName!: string;

  lastName!: string;

  password!: string;

  passwordConfirm!: string;

  role!: AdminTypes;
}
