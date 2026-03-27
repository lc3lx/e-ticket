import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import EventType from './eventType.model.js';
import { Supervisor } from './supervisor.model.js';

interface SupervisorEventTypeAttributes {
  supervisorId: number;
  eventTypeId: number;
}

class SupervisorEventType extends Model<SupervisorEventTypeAttributes> implements SupervisorEventTypeAttributes {
  declare supervisorId: number;

  declare eventTypeId: number;
}

SupervisorEventType.init(
  {
    supervisorId: {
      type: DataTypes.INTEGER,
      references: {
        model: Supervisor,
        key: 'id',
      },
    },
    eventTypeId: {
      type: DataTypes.INTEGER,
      references: {
        model: EventType,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'SupervisorEventType',
    timestamps: false,
    indexes: [{ unique: true, fields: ['supervisorId', 'eventTypeId'] }],
  },
);

SupervisorEventType.belongsTo(Supervisor, {
  foreignKey: 'supervisorId',
  as: 'supervisor',
});
SupervisorEventType.belongsTo(EventType, {
  foreignKey: 'eventTypeId',
  as: 'eventTypes',
});

export default SupervisorEventType;
