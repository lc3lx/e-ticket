import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';

interface SyriatelEPaymentTokenAttributes {
  id: number;
  token: string;
  expiredAt: Date;
  errorCode: string;
  errorDesc: string;
  merchantMSISDN: string;
  username: string;
  password: string;
}

interface SyriatelEPaymentTokenCreationAttributes extends Optional<SyriatelEPaymentTokenAttributes, 'id'> {}

class SyriatelEPaymentToken
  extends Model<SyriatelEPaymentTokenAttributes, SyriatelEPaymentTokenCreationAttributes>
  implements SyriatelEPaymentTokenAttributes
{
  declare id: number;
  declare token: string;
  declare expiredAt: Date;
  declare errorCode: string;
  declare errorDesc: string;
  declare merchantMSISDN: string;
  declare username: string;
  declare password: string;
}

SyriatelEPaymentToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      // unique: true,
      // primaryKey: true,
    },
    expiredAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    errorCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    errorDesc: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    merchantMSISDN: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'SyriatelEPaymentToken',
    modelName: 'SyriatelEPaymentToken',
    timestamps: true,
    indexes: [{ fields: ['token'], unique: true }],
  },
);

export default SyriatelEPaymentToken;
