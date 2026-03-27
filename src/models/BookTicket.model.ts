import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import { errorMessage } from '../modules/i18next.config.js';
import BookTicketStatus from '../common/enums/bookTicketStatus.enum.js';
import BookTicketPaymentStatus from '../common/enums/bookTicketPaymentStatus.enum.js';
import EPayment from './allEPayment.model.js';

interface BookTicketAttributes {
  id: number;
  eventId: number;
  userId: number;
  ticketsCount: number;
  ticketPrice: number;
  ticketOption: string;
  status: BookTicketStatus;
  paymentStatus: BookTicketPaymentStatus;
  discountCode?: string;
  totalPrice: number;
  isPaperCopy: boolean;
  note?: string;
  cancelAfter: Date | null;
  paymentMethodId: number | null;
  // totalProfit: number;
  // totalProfitWithDiscount: number;
}

interface BookTicketCreationAttributes extends Optional<BookTicketAttributes, 'id'> {}

class BookTicket extends Model<BookTicketAttributes, BookTicketCreationAttributes> implements BookTicketAttributes {
  [x: string]: any;
  declare id: number;
  declare eventId: number;
  declare userId: number;
  declare ticketsCount: number;
  declare ticketPrice: number;
  declare ticketOption: string;
  declare status: BookTicketStatus;
  declare paymentStatus: BookTicketPaymentStatus;
  declare discountCode?: string;
  declare totalPrice: number;
  declare isPaperCopy: boolean;
  declare note?: string;
  declare cancelAfter: Date | null;
  declare paymentMethodId: number | null;
  // declare totalProfit: number;
  // declare totalProfitWithDiscount: number;
}

BookTicket.init(
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
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'NormalUser',
        key: 'id',
      },
      onDelete: 'CASCADE',
      allowNull: false,
    },
    ticketsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        isInt: { msg: errorMessage('ErrorKey.InvalidTicketsCount') },
        min: { args: [1], msg: errorMessage('ErrorKey.TicketsCountMin') },
      },
    },
    ticketPrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: errorMessage('ErrorKey.InvalidTicketPrice') },
        min: { args: [0], msg: errorMessage('ErrorKey.TicketPriceMin') },
      },
    },
    ticketOption: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: errorMessage('ErrorKey.EmptyTicketOption') },
        isIn: {
          args: [['economy', 'classic', 'vip']],
          msg: errorMessage('ErrorKey.InvalidTicketOption'),
        },
        len: { args: [1, 50], msg: errorMessage('ErrorKey.TicketOptionLength') },
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(BookTicketStatus)),
      defaultValue: BookTicketStatus.PENDING,
      allowNull: false,
      validate: {
        isValidStatus(value: BookTicketStatus) {
          if (!Object.values(BookTicketStatus).includes(value)) {
            throw new Error(`Invalid Booking status: ${value}`);
          }
        },
      },
    },
    paymentStatus: {
      type: DataTypes.ENUM(...Object.values(BookTicketPaymentStatus)),
      defaultValue: BookTicketPaymentStatus.PENDING,
      allowNull: false,
      validate: {
        isValidStatus(value: BookTicketPaymentStatus) {
          if (!Object.values(BookTicketPaymentStatus).includes(value)) {
            throw new Error(`Invalid Booking Payment status: ${value}`);
          }
        },
      },
    },
    totalPrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: errorMessage('ErrorKey.InvalidTotalPrice') },
      },
    },
    discountCode: {
      type: DataTypes.STRING,
      allowNull: true,
      // references: {
      //   model: 'DiscountCode',
      //   key: 'id',
      // },
      // onDelete: 'CASCADE',
      // allowNull: false,
    },
    isPaperCopy: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      validate: {
        isBoolean: { msg: errorMessage('ErrorKey.InvalidIsPaperCopy') },
      },
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: { args: [0, 500], msg: errorMessage('ErrorKey.NoteLength') },
      },
    },
    cancelAfter: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: { args: true, msg: errorMessage('ErrorKey.InvalidCancelAfter') },
      },
      get() {
        const rawValue = this.getDataValue('cancelAfter');
        if (!rawValue) return null;

        // Convert the UTC date from DB to a local Damascus Date (+3 hours)
        // We add 3 hours to the timestamp before returning it to the app
        return new Date(new Date(rawValue).getTime() + 3 * 60 * 60 * 1000);
      },
    },
    paymentMethodId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'EPayment', key: 'id' },
      onDelete: 'CASCADE',
    },
    // totalProfit: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    //   defaultValue: 0,
    // },
    // totalProfitWithDiscount: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    //   defaultValue: 0,
    // },
  },
  {
    sequelize,
    tableName: 'BookTicket',
    timestamps: true,
    indexes: [{ fields: ['status'] }, { fields: ['paymentStatus'] }, { fields: ['cancelAfter'] }],
  },
);

BookTicket.belongsTo(EPayment, { foreignKey: 'paymentMethodId', as: 'paymentMethod' });
EPayment.hasMany(BookTicket, { foreignKey: 'paymentMethodId', as: 'bookTickets' });

export default BookTicket;
