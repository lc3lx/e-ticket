/* eslint-disable import/prefer-default-export */
import Gender from '../../common/enums/gender.enum';

export class RegisterSupervisorDto {
  mobileNumber!: string;

  userName!: string;

  firstName!: string;

  lastName!: string;

  password!: string;

  passwordConfirm!: string;

  gender!: Gender;

  birthDate!: Date;

  province!: number;

  location!: string;

  workInfo!: string;

  workType!: number[];

  workDocument!: string;
}
