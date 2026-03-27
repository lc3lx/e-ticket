/* eslint-disable import/prefer-default-export */
import Gender from '../../common/enums/gender.enum';
// import Provinces from '../../common/enums/provinces.enum';

export class RegisterUserDto {
  mobileNumber!: string;

  firstName!: string;

  lastName!: string;

  gender!: Gender;

  provinces!: number[];

  birthDate!: Date;

  eventTypeId!: number[];

  // code?: string; //OTP
}
