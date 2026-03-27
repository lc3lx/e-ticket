/* eslint-disable import/prefer-default-export */

import Gender from '../../common/enums/gender.enum';

export class UpdateUserDto {
  mobileNumber?: string;

  firstName?: string;

  lastName?: string;

  gender?: Gender;

  birthDate?: Date;

  eventTypeIds?: number[];

  provinceIds?: number[];

  profilePicture?: string;
}
