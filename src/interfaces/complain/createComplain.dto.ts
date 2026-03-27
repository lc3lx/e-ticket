/* eslint-disable import/prefer-default-export */

export class CreateComplainDto {
  userId!: number;

  eventId!: number;

  complainTypeId!: number;

  customComplain?: string | null;
}
