import EventStatus from '../../common/enums/eventStatus.enum';
import AttendanceType from '../../common/enums/AttendanceType.enum';

// eslint-disable-next-line import/prefer-default-export
export class UpdateEventDTO {
  id!: number;

  supervisorId!: number;

  eventName?: string;

  mainPhoto?: string;

  miniPoster?: string;

  eventPhotos?: string[];

  eventType?: number;

  startEventDate?: Date;

  endEventDate?: Date;

  startApplyDate?: Date;

  endApplyDate?: Date;

  startEventHour?: string;

  endEventHour?: string;

  province?: number;

  location?: string;

  ticketOptionsAndPrices?: { [key: string]: number };

  seatsQty?: number;

  description?: string;

  notes?: string;

  eventStatus?: EventStatus;

  attendanceType?: AttendanceType;

  needApproveFromSupervisor?: boolean;

  //   isVisible: boolean;
}
