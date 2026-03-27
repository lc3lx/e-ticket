import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import SyriatelEPaymentStatus from '../common/enums/SyriatelEPaymentStatus.enum.js';

interface SyriatelEPaymentAttributes {
  id: number;
  errorCode: string;
  errorDesc: string;
  bookId: number;
  paymentMethodId: number;
  status: SyriatelEPaymentStatus;
  customerMSISDN: string;
  transactionID?: string;
  amount: string;
}

interface SyriatelEPaymentCreationAttributes extends Optional<SyriatelEPaymentAttributes, 'id'> {}

class SyriatelEPayment
  extends Model<SyriatelEPaymentAttributes, SyriatelEPaymentCreationAttributes>
  implements SyriatelEPaymentAttributes
{
  declare id: number;
  declare errorCode: string;
  declare errorDesc: string;
  declare bookId: number;
  declare paymentMethodId: number;
  declare status: SyriatelEPaymentStatus;
  declare customerMSISDN: string;
  declare transactionID?: string;
  declare amount: string;
}

SyriatelEPayment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    errorCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    errorDesc: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bookId: { type: DataTypes.INTEGER, references: { model: 'BookTicket', key: 'id' }, allowNull: false },
    paymentMethodId: { type: DataTypes.INTEGER, references: { model: 'EPayment', key: 'id' }, allowNull: false },
    status: {
      type: DataTypes.ENUM(...Object.values(SyriatelEPaymentStatus)),
      allowNull: false,
    },
    customerMSISDN: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    transactionID: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    amount: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'SyriatelEPayment',
    modelName: 'SyriatelEPayment',
    timestamps: true,
    indexes: [
      { fields: ['id'], unique: true },
      { fields: ['bookId'], unique: false },
    ],
  },
);

export default SyriatelEPayment;
