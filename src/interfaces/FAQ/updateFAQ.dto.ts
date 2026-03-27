/* eslint-disable import/prefer-default-export */

export class UpdateFAQ {
  id!: number;
  question?: string;
  answer?: string;
  order?: number;
  userType?: 'supervisor' | 'normalUser';
}
