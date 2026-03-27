import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';

interface SupervisorRequestAttributes {
  id: number;
  supervisorId: number;
  requestType: 'eventCreate' | 'eventUpdate' | 'profileUpdate' | 'profileDelete';
  requestTargetId: number | null;
}

interface SupervisorRequestCreationAttributes extends Optional<SupervisorRequestAttributes, 'id'> {}

export class SupervisorRequest
  extends Model<SupervisorRequestAttributes, SupervisorRequestCreationAttributes>
  implements SupervisorRequestAttributes
{
  declare id: number;

  declare supervisorId: number;

  declare requestType: 'eventCreate' | 'eventUpdate' | 'profileUpdate' | 'profileDelete';

  declare requestTargetId: number | null;

  declare messages?: any;
}

SupervisorRequest.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    supervisorId: { type: DataTypes.INTEGER, allowNull: false },
    requestType: {
      type: DataTypes.ENUM('eventCreate', 'eventUpdate', 'profileUpdate', 'profileDelete'),
      allowNull: false,
    },
    requestTargetId: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, modelName: 'SupervisorRequest', tableName: 'SupervisorRequest', timestamps: true },
);

export default SupervisorRequest;
