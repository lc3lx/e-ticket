import { Model, DataTypes, Optional, Association } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import { errorMessage } from '../modules/i18next.config.js';
import BookTicket from './BookTicket.model.js';

// add scans counter
interface TicketAttributes {
  id: number;
  bookingId: number;
  serialNumber: string;
  scans: number;
  scanCounter: number;
  username: string;
  isValid?: boolean;
  isSuspended?: boolean;

  booking?: any;

  createdAt?: Date;
  updatedAt?: Date;
}

interface TicketCreationAttributes extends Optional<TicketAttributes, 'id'> {}

class Ticket extends Model<TicketAttributes, TicketCreationAttributes> implements TicketAttributes {
  declare id: number;
  declare bookingId: number;
  declare serialNumber: string;
  declare scans: number;
  declare scanCounter: number;
  declare username: string;
  declare isValid?: boolean;
  declare isSuspended?: boolean;

  public readonly booking?: BookTicket;

  static associations: {
    booking: Association<Ticket, BookTicket>;
  };
}

Ticket.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    bookingId: {
      type: DataTypes.INTEGER,
      references: { model: 'BookTicket', key: 'id' },
      onDelete: 'CASCADE',
      allowNull: false,
    },
    scans: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        isNumeric: { msg: 'it must be a number' },
        min: {
          args: [0],
          msg: 'scans cannot be negative',
        },
      },
    },
    scanCounter: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isNumeric: { msg: 'it must be a number' },
        min: {
          args: [0],
          msg: 'scans cannot be negative',
        },
        isValid(this: { scans: number }, value: number) {
          if (value > this.scans) {
            throw new Error('scanCounter cannot be greater than scans');
          }
        },
      },
    },
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Serial number cannot be empty' },
        len: {
          args: [7, 15],
          msg: 'Serial number must be 7–15 characters',
        },
        matches: {
          args: /^TKT-\d{6}$/,
          msg: 'Serial number must be in format TKT-<6-digit-number> (e.g., TKT-100001)',
        },
      },
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: errorMessage('error.usernameEmpty') },
        matches: {
          args: /^[a-zA-Z\s\u0600-\u06FF]{2,50}$/,
          msg: errorMessage('error.usernameFormat'),
        },
      },
    },
    isValid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      validate: {
        cannotBeReactivated(value: boolean) {
          if (!this.isNewRecord && value === true && this.isValid === false) {
            throw new Error(errorMessage('error.cannotReactivateTicket'));
          }
        },
      },
    },
    isSuspended: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      validate: {
        isBoolean: { msg: 'isSuspended must be a boolean' },
      },
    },
  },
  { sequelize, tableName: 'Ticket', timestamps: true },
);

export default Ticket;
