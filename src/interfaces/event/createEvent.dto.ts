import EventStatus from '../../common/enums/eventStatus.enum';
import AttendanceType from '../../common/enums/AttendanceType.enum';

export class CreateEventDTO {
  supervisorId!: number;

  eventName!: string;

  mainPhoto!: string;

  miniPoster!: string;

  eventPhotos!: string[];

  eventType!: number;

  startEventDate!: Date;

  endEventDate!: Date;

  startApplyDate!: Date;

  endApplyDate!: Date;

  startEventHour!: string;

  endEventHour!: string;

  province!: number;

  location!: string;

  ticketOptionsAndPrices!: { [key: string]: number };

  seatsQty!: number;

  description!: string;

  notes?: string;

  attendanceType!: AttendanceType;

  eventStatus!: EventStatus;

  needApproveFromSupervisor!: boolean;

  hasSentRateReminder!: false;
}
