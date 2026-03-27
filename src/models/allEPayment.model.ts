import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';

interface EPaymentAttributes {
  id: number;
  ServiceName: string;
  paymentMethodLogo: string | undefined;
  color: string;
  isEnabled?: boolean;
  mobileNumber: string;
  bankName: string;
  bankAccount: string;
}

interface EPaymentCreationAttributes extends Optional<EPaymentAttributes, 'id'> {}

class EPayment extends Model<EPaymentAttributes, EPaymentCreationAttributes> implements EPaymentAttributes {
  declare id: number;
  declare ServiceName: string;
  declare paymentMethodLogo: string;
  declare color: string;
  declare isEnabled?: boolean;
  declare mobileNumber: string;
  declare bankName: string;
  declare bankAccount: string;
}

EPayment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    ServiceName: { type: DataTypes.STRING, allowNull: false, unique: true },
    paymentMethodLogo: { type: DataTypes.STRING, allowNull: true },
    color: { type: DataTypes.STRING, allowNull: false },
    isEnabled: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    mobileNumber: { type: DataTypes.STRING, allowNull: false },
    bankName: { type: DataTypes.STRING, allowNull: false },
    bankAccount: { type: DataTypes.STRING, allowNull: false },
  },
  {
    sequelize,
    tableName: 'EPayment',
    modelName: 'EPayment',
    timestamps: true,
  },
);

export default EPayment;
