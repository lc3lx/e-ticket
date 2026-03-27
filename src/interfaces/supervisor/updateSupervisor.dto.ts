/* eslint-disable import/prefer-default-export */
import Gender from '../../common/enums/gender.enum';

export class UpdateSupervisorDto {
  supervisorId!: number;

  mobileNumber?: string;

  userId!: number;

  firstName?: string;

  lastName?: string;

  gender?: Gender;

  birthDate?: Date;

  province?: number;

  location?: string;

  workInfo?: string;

  workType?: number[];

  workDocument?: string;
}
