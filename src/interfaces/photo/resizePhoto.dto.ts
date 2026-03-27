/* eslint-disable import/prefer-default-export */

export class ResizePhotoDTO {
  //   mobileNumber?: string;
  id?: number;

  fileName!: string;

  fieldName!: string;

  file!: Buffer;

  eventName?: string;

  eventId?: number;

  counter?: number;
}
