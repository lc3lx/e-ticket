import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import NotificationAdmin from './notificationAdmin.model.js';
import EventType from './eventType.model.js';

class NotificationAdminEventType extends Model {
  declare notificationAdminId: number;
  declare eventTypeId: number;
}

NotificationAdminEventType.init(
  {
    notificationAdminId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: NotificationAdmin,
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    eventTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: EventType,
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    modelName: 'NotificationAdminEventType',
    tableName: 'NotificationAdminEventType',
    timestamps: false,
  },
);

export default NotificationAdminEventType;
