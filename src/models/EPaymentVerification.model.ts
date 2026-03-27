import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import BookTicket from './BookTicket.model.js';
import { errorMessage } from '../modules/i18next.config.js';

interface PaymentVerificationAttributes {
  id: number;
  serviceName: string;
  bookId: number;
  expiresAt: Date;
  nextAllowed: Date;
  retries: number;
  minutesToWait: number;
  verifiedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PaymentVerificationCreation extends Optional<PaymentVerificationAttributes, 'id' | 'verifiedAt'> {}

class PaymentVerification
  extends Model<PaymentVerificationAttributes, PaymentVerificationCreation>
  implements PaymentVerificationAttributes
{
  declare id: number;
  declare serviceName: string;
  declare bookId: number;
  declare expiresAt: Date;
  declare nextAllowed: Date;
  declare retries: number;
  declare minutesToWait: number;
  declare verifiedAt: Date | null;
}

PaymentVerification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bookId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: BookTicket,
        key: 'id',
      },
      onDelete: 'CASCADE',
      validate: {
        notNull: { msg: errorMessage('error.bookIdRequired') },
      },
    },
    serviceName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    nextAllowed: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    retries: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    minutesToWait: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'PaymentVerification',
    modelName: 'PaymentVerification',
  },
);

export default PaymentVerification;
