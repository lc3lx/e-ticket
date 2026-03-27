import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import { errorMessage } from '../modules/i18next.config.js';
import Province from './provinces.model.js';

interface AgentAttributes {
  id: number;
  name: string;
  agentPhoto?: string;
  provinceId?: number;
  location: string;
  mobileNumber: string;
}

interface AgentCreationAttributes extends Optional<AgentAttributes, 'id'> {}

class Agent extends Model<AgentAttributes, AgentCreationAttributes> implements AgentAttributes {
  declare id: number;
  declare name: string;
  declare agentPhoto?: string;
  declare provinceId?: number;
  declare location: string;
  declare mobileNumber: string;
}

Agent.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: errorMessage('error.agentNameRequired') },
        notNull: { msg: errorMessage('error.agentNameRequired') },
      },
    },
    agentPhoto: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    provinceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Province,
        key: 'id',
      },
      onDelete: 'RESTRICT',
      validate: {
        notNull: {
          msg: 'agentProvinceRequired',
        },
      },
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: errorMessage('error.agentLocationRequired') },
      },
    },
    mobileNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: 'unique_mobileNumber',
        msg: errorMessage('error.mobileNumberExists'),
      },
      validate: {
        isInt: {
          msg: errorMessage('error.phoneNumberTypeValidation'),
        },
        notEmpty: { msg: errorMessage('error.agentMobileNumberRequired') },
      },
    },
  },
  {
    sequelize,
    tableName: 'Agent',
    timestamps: true,
  },
);

Agent.belongsTo(Province, {
  foreignKey: 'provinceId',
  as: 'province',
});

export default Agent;
