import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import SupervisorRequest from './supervisorRequest.model.js';

interface RequestMessageAttributes {
  id: number;
  supervisorRequestId: number;
  senderRole: 'supervisor' | 'admin';
  message: string;
  createdAt?: Date;
}

interface RequestMessageCreationAttributes extends Optional<RequestMessageAttributes, 'id'> {}

export class RequestMessage
  extends Model<RequestMessageAttributes, RequestMessageCreationAttributes>
  implements RequestMessageAttributes
{
  declare id: number;

  declare supervisorRequestId: number;

  declare senderRole: 'supervisor' | 'admin';

  declare message: string;

  declare createdAt?: Date;
}

RequestMessage.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    supervisorRequestId: {
      type: DataTypes.INTEGER,
      references: { model: SupervisorRequest, key: 'id' },
      allowNull: false,
    },
    senderRole: { type: DataTypes.ENUM('supervisor', 'admin'), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: true },
  },
  { sequelize, modelName: 'RequestMessage', tableName: 'RequestMessage', timestamps: true },
);

SupervisorRequest.hasMany(RequestMessage, { foreignKey: 'supervisorRequestId', as: 'messages' });
RequestMessage.belongsTo(SupervisorRequest, { foreignKey: 'supervisorRequestId' });

export default RequestMessage;
