import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import EventType from './eventType.model.js';
import NormalUser from './normalUser.model.js';
import AppError from '../utils/AppError.js';

interface UserEventTypeAttributes {
  userId: number;
  eventTypeId: number;
}

class UserEventType extends Model<UserEventTypeAttributes> implements UserEventTypeAttributes {
  declare userId: number;

  declare eventTypeId: number;
}

UserEventType.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      // allowNull: false,
      references: {
        model: NormalUser,
        key: 'id',
      },
    },
    eventTypeId: {
      type: DataTypes.INTEGER,
      // allowNull: false,
      references: {
        model: EventType,
        key: 'id',
      },
      validate: {
        isPositive(value: number) {
          if (value <= 0) throw new AppError('normalUserEventsTypes', 400);
        },
      },
    },
  },
  {
    sequelize,
    tableName: 'UserEventType',
    timestamps: true,
    indexes: [{ unique: true, fields: ['userId', 'eventTypeId'] }],
  },
);

export default UserEventType;

