import Gender from '../../common/enums/gender.enum';

export class CreateNotificationAdminDTO {
  title!: string;
  body!: string;
  sendDate?: Date;
  targetedUsersType!: 'normalUser' | 'supervisor';
  gender?: Gender;
  minAge?: number;
  maxAge?: number;
  eventTypeIds?: number[];
  provinceIds?: number[];
}
