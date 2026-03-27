import { DataTypes, Model, Optional, UpdateOptions, Op } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import EventType from './eventType.model.js';
import Province from './provinces.model.js';
import EventStatus from '../common/enums/eventStatus.enum.js';
import TicketType from '../common/enums/ticketTypes.enum.js';
import { errorMessage } from '../modules/i18next.config';
import AttendanceType from '../common/enums/AttendanceType.enum.js';
import { Supervisor } from './supervisor.model.js';
import { combineDateAndHour, compareDateAndHour } from '../utils/dateTimeForEvents.js';
import AppError from '../utils/AppError.js';

interface TicketOption {
  price: number;
  description: string;
}

interface EventAttributes {
  id: number;
  supervisorId: number;
  eventName: string;
  slug?: string;
  mainPhoto: string;
  miniPoster: string;
  eventPhotos: string[];
  eventType: number;
  startEventDate: Date;
  endEventDate: Date;
  startApplyDate: Date;
  endApplyDate: Date;
  startEventHour: string;
  endEventHour: string;
  province: number;
  location: string;
  ticketOptionsAndPrices: {
    VIP?: TicketOption;
    Classic?: TicketOption;
    Economy?: TicketOption;
  };
  attendanceType: AttendanceType;
  seatsQty: number;
  availableTickets?: number;
  description: string;
  notes?: string;
  eventStatus?: EventStatus;
  needApproveFromSupervisor: boolean;
  visitCount?: number;
  isApproved?: boolean;
  isDeclined?: boolean;
  isVisible?: boolean;
  hasSentRateReminder: boolean;
  profit?: number;
}

export interface EventCreationAttributes extends Optional<EventAttributes, 'id'> {}

export interface CustomUpdateOptions extends UpdateOptions<EventAttributes> {
  skipPreHooks?: boolean;
}

class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
  declare id: number;

  declare supervisorId: number;

  declare eventName: string;

  public get slug(): string {
    return this.eventName.split(' ').join('-').toLowerCase();
  }
  declare mainPhoto: string;
  declare miniPoster: string;
  declare eventPhotos: string[];
  declare eventType: number;
  declare startEventDate: Date;
  declare endEventDate: Date;
  declare startApplyDate: Date;
  declare endApplyDate: Date;
  declare startEventHour: string;
  declare endEventHour: string;
  declare province: number;
  declare location: string;
  declare ticketOptionsAndPrices: {
    VIP?: TicketOption;
    Classic?: TicketOption;
    Economy?: TicketOption;
  };
  declare attendanceType: AttendanceType;
  declare seatsQty: number;
  declare availableTickets?: number;
  declare description: string;
  declare notes?: string;
  declare eventStatus?: EventStatus;
  declare needApproveFromSupervisor: boolean;
  declare visitCount?: number;
  declare isApproved?: boolean;
  declare isDeclined?: boolean;
  declare isVisible?: boolean;
  declare hasSentRateReminder: boolean;
  declare supervisor: Supervisor;
  declare profit?: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Event.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
      allowNull: false,
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
      get(this: Event) {
        return this.getDataValue('eventName')?.split(' ').join('-').toLowerCase();
      },
    },
    mainPhoto: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: errorMessage('error.eventMainPhotoMissing'),
        },
      },
    },
    miniPoster: {
      type: DataTypes.STRING,
      allowNull: false,
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
      allowNull: false,
      references: {
        model: EventType,
        key: 'id',
      },
      onDelete: 'RESTRICT',
    },
    startEventDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endEventDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startApplyDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: errorMessage('error.applyToEventStartDate'),
        },
      },
    },
    endApplyDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startEventHour: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: errorMessage('error.startEventHourEmpty'),
        },
      },
    },
    endEventHour: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: errorMessage('error.endEventHourEmpty'),
        },
      },
    },
    province: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
      allowNull: false,
      validate: {
        notEmpty: {
          msg: errorMessage('error.eventLocation'),
        },
      },
    },
    ticketOptionsAndPrices: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        validTicketOptions(value: { VIP?: TicketOption; Classic?: TicketOption; Economy?: TicketOption }) {
          const allowedTypes = Object.values(TicketType);
          Object.keys(value).forEach((key) => {
            if (!allowedTypes.includes(key as TicketType)) throw new Error(`Invalid ticket type: ${key}`);

            const option = value[key as keyof typeof value];

            if (option && option.price <= 0) throw new Error(errorMessage('error.priceNotZero'));

            if (option && typeof option.description !== 'string')
              throw new Error(`Description for ${key} must be a string.`);
          });
        },
        notEmpty: {
          msg: errorMessage('error.ticketOptionEmpty'),
        },
      },
    },
    attendanceType: {
      type: DataTypes.ENUM(...Object.values(AttendanceType)),
      allowNull: false,
      defaultValue: 'any',
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
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: errorMessage('error.eventSeatsValidation'),
        },
      },
    },
    availableTickets: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: errorMessage('error.eventDescriptionValidation'),
        },
        len: {
          args: [1, 500],
          msg: errorMessage('error.eventDescriptionLengthValidation'),
        },
      },
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    eventStatus: {
      type: DataTypes.ENUM(...Object.values(EventStatus)),
      allowNull: false,
      defaultValue: 'commingSoon',
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
      allowNull: false,
    },
    visitCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isDeclined: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    hasSentRateReminder: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    profit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'Event',
    paranoid: true,
    timestamps: true,
    indexes: [{ fields: ['eventName'] }, { fields: ['isDeclined'] }, { fields: ['isApproved'] }],
    defaultScope: {
      where: {
        isVisible: true,
        isApproved: true,
        isDeclined: false,
        eventStatus: {
          [Op.ne]: EventStatus.CANCELEDBYSYSTEMADMIN,
        },
      },
    },
  },
);

Event.addScope('withHidden', {
  where: {},
});
Event.addScope('withHiddenAndAccepted', {
  where: { isApproved: true },
});
Event.addScope('onlyHidden', {
  where: {
    isVisible: false,
  },
});
Event.addScope('withNotAccepted', {
  where: { isVisible: true },
});
Event.addScope('onlyNotAccepted', {
  where: {
    isVisible: true,
    isDeclined: false,
    isApproved: false,
  },
});

Event.belongsTo(EventType, {
  foreignKey: 'eventType',
  as: 'eventTypeRelation',
});
Event.belongsTo(Province, {
  foreignKey: 'province',
  as: 'provinceRelation',
});

Event.beforeCreate((event) => {
  event.availableTickets = event.seatsQty;
});

Event.beforeUpdate((event, options: CustomUpdateOptions) => {
  if (options.skipPreHooks) return;
  if (event.previous().isApproved === true) {
    throw new Error(errorMessage('error.eventUpdateAfterApprove'));
  }
});

Event.beforeUpdate((event, options: CustomUpdateOptions) => {
  if (event.previous().isDeclined === true) {
    throw new AppError(errorMessage('error.eventUpdateAfterDecline'), 400);
  }
});

Event.beforeUpdate((event, options: CustomUpdateOptions) => {
  const eventEnd = combineDateAndHour(
    event.endEventDate,
    event.endEventHour,
    combineDateAndHour(event.startEventDate, event.startEventHour),
  );
  if (eventEnd <= new Date()) {
    throw new AppError(errorMessage('error.UpdateEventAfterEnd'), 400);
  }

  const applyEnd = combineDateAndHour(
    event.endApplyDate,
    event.endEventHour,
    combineDateAndHour(event.startApplyDate, event.startEventHour),
  );
  if (applyEnd <= new Date()) {
    throw new AppError(errorMessage('error.UpdateEventAfterEndReservation'), 400);
  }
});

export default Event;
