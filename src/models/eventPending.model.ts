import { DataTypes, Model, Optional, UpdateOptions } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import EventType from './eventType.model.js';
import Province from './provinces.model.js';
import Event from './event.model.js';
import EventStatus from '../common/enums/eventStatus.enum.js';
import TicketType from '../common/enums/ticketTypes.enum.js';
import { errorMessage } from '../modules/i18next.config';
import AttendanceType from '../common/enums/AttendanceType.enum.js';
import { combineDateAndHour } from '../utils/dateTimeForEvents.js';
import AppError from '../utils/AppError.js';

interface TicketOption {
  price: number;
  description: string;
}

interface PendingEventAttributes {
  id: number;
  eventId: number;
  supervisorId: number;
  eventName?: string;
  slug?: string;
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
  ticketOptionsAndPrices?: {
    VIP?: TicketOption;
    Classic?: TicketOption;
    Economy?: TicketOption;
  };
  attendanceType?: AttendanceType;
  seatsQty?: number;
  description?: string;
  notes?: string;
  eventStatus?: EventStatus;
  needApproveFromSupervisor?: boolean;
  visitCount?: number;
  isUpdateApproved?: boolean;
  isUpdateDeclined?: boolean;
  profit?: number;
}

export interface PendingEventCreationAttributes extends Optional<PendingEventAttributes, 'id'> {}

export interface CustomUpdateOptionsPendingEvent extends UpdateOptions<PendingEventAttributes> {
  skipPreHooks?: boolean;
}

class PendingEvent
  extends Model<PendingEventAttributes, PendingEventCreationAttributes>
  implements PendingEventAttributes
{
  declare id: number;
  declare eventId: number;
  declare supervisorId: number;
  declare eventName?: string;
  declare mainPhoto?: string;
  declare miniPoster?: string;
  declare eventPhotos?: string[];
  declare eventType?: number;
  declare startEventDate?: Date;
  declare endEventDate?: Date;
  declare startApplyDate?: Date;
  declare endApplyDate?: Date;
  declare startEventHour?: string;
  declare endEventHour?: string;
  declare province?: number;
  declare location?: string;
  declare ticketOptionsAndPrices?: {
    VIP?: TicketOption;
    Classic?: TicketOption;
    Economy?: TicketOption;
  };
  declare attendanceType?: AttendanceType;
  declare seatsQty?: number;
  declare description?: string;
  declare notes?: string;
  declare eventStatus?: EventStatus;
  declare needApproveFromSupervisor?: boolean;
  declare visitCount?: number;
  declare isUpdateApproved?: boolean;
  declare isUpdateDeclined?: boolean;
  declare profit?: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PendingEvent.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    eventId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Event',
        key: 'id',
      },
      onDelete: 'CASCADE',
      allowNull: false,
    },
    supervisorId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Supervisor',
        key: 'id',
      },
      onDelete: 'CASCADE',
      allowNull: false,
    },
    eventName: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [2, 50],
          msg: errorMessage('error.eventNameLengthError'),
        },
        notEmpty: {
          msg: errorMessage('error.eventNameEmptyError'),
        },
        isAlphaSpace(value: string) {
          if (!/^[\u0600-\u06FFa-zA-Z0-9\s]+$/.test(value)) {
            throw new Error(errorMessage('error.eventNameError'));
          }
        },
      },
    },
    slug: {
      type: DataTypes.VIRTUAL,
      get(this: PendingEvent) {
        return this.getDataValue('eventName')?.split(' ').join('-').toLowerCase();
      },
    },
    mainPhoto: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: errorMessage('error.eventMainPhotoMissing'),
        },
      },
    },
    miniPoster: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: errorMessage('error.eventMainPhotoMissing'),
        },
      },
    },
    eventPhotos: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    eventType: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: EventType,
        key: 'id',
      },
      onDelete: 'RESTRICT',
    },
    startEventDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: errorMessage('error.eventStartDate'),
        },
      },
    },
    endEventDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: errorMessage('error.eventEndDate'),
        },
      },
    },
    startApplyDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: errorMessage('error.applyToEventStartDate'),
        },
      },
    },
    endApplyDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: errorMessage('error.applyToEventEndDate'),
        },
      },
    },
    startEventHour: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    endEventHour: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    province: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Province,
        key: 'id',
      },
      onDelete: 'RESTRICT',
      validate: {
        notEmpty: {
          msg: errorMessage('error.eventProvince'),
        },
      },
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: errorMessage('error.eventLocation'),
        },
      },
    },
    ticketOptionsAndPrices: {
      type: DataTypes.JSONB,
      allowNull: true,
      validate: {
        validTicketOptions(value: { VIP?: TicketOption; Classic?: TicketOption; Economy?: TicketOption }) {
          if (value === null || value === undefined) return;
          const allowedTypes = Object.values(TicketType);
          Object.keys(value).forEach((key) => {
            if (!allowedTypes.includes(key as TicketType)) throw new Error(`Invalid ticket type: ${key}`);
            const option = value[key as keyof typeof value];

            if (option && option.price <= 0) throw new Error(errorMessage('error.PriceNotZero'));
            if (option && typeof option.description !== 'string')
              throw new Error(`Description for ${key} must be a string.`);
          });
        },
      },
    },
    attendanceType: {
      type: DataTypes.ENUM(...Object.values(AttendanceType)),
      allowNull: true,
      validate: {
        isValidStatus(value: AttendanceType) {
          if (!Object.values(AttendanceType).includes(value)) {
            throw new Error(`Invalid Attendance Type: ${value}`);
          }
        },
      },
    },
    seatsQty: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: [1],
          msg: errorMessage('error.eventSeatsValidation'),
        },
      },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: errorMessage('error.eventDescriptionValidation'),
        },
      },
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    eventStatus: {
      type: DataTypes.ENUM(...Object.values(EventStatus)),
      allowNull: true,
      validate: {
        isValidStatus(value: EventStatus) {
          if (!Object.values(EventStatus).includes(value)) {
            throw new Error(`Invalid event status: ${value}`);
          }
        },
      },
    },
    needApproveFromSupervisor: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    visitCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isUpdateApproved: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    isUpdateDeclined: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    profit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'PendingEvent',
    paranoid: true,
    timestamps: true,
    indexes: [{ fields: ['eventName'] }, { fields: ['isUpdateApproved'] }, { fields: ['isUpdateDeclined'] }],

    defaultScope: {
      where: {
        isUpdateApproved: false,
      },
    },
  },
);

PendingEvent.addScope('withAll', {
  where: {},
});
PendingEvent.addScope('onlyAccepted', {
  where: {
    isUpdateApproved: true,
  },
});
PendingEvent.addScope('onlyNotAccepted', {
  where: {
    isUpdateApproved: false,
    isUpdateDeclined: false,
  },
});

PendingEvent.belongsTo(EventType, {
  foreignKey: 'eventType',
  as: 'eventTypeRelation',
});
PendingEvent.belongsTo(Province, {
  foreignKey: 'province',
  as: 'provinceRelation',
});
PendingEvent.belongsTo(Event, {
  foreignKey: 'eventId',
  as: 'originalEvent',
});

PendingEvent.beforeUpdate((event, options: CustomUpdateOptionsPendingEvent) => {
  if (options.skipPreHooks) return;
  if (event.isUpdateDeclined === true) {
    throw new Error('Event cannot be modified after it is Declined');
  }
});

PendingEvent.beforeUpdate((event, options: CustomUpdateOptionsPendingEvent) => {
  if (options.skipPreHooks) return;
  if (event.isUpdateApproved === true) {
    throw new Error('Event cannot be modified after it is applied');
  }
});

PendingEvent.beforeUpdate((event, options: any) => {
  const eventEnd = combineDateAndHour(
    event.endEventDate!,
    event.endEventHour!,
    combineDateAndHour(event.startEventDate!, event.startEventHour!),
  );
  if (eventEnd <= new Date()) {
    throw new AppError(errorMessage('error.UpdateEventAfterEnd'), 400);
  }

  const applyEnd = combineDateAndHour(
    event.endApplyDate!,
    event.endEventHour!,
    combineDateAndHour(event.startApplyDate!, event.startEventHour!),
  );
  if (applyEnd <= new Date()) {
    throw new AppError(errorMessage('error.UpdateEventAfterEndReservation'), 400);
  }
});

export default PendingEvent;
