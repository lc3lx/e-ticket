import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import User from './user.model.js';
import NotificationTypes from '../common/enums/notificationTypes.enum';

const USER_TYPES = ['supervisor', 'normalUser'] as const;

interface NotificationAttributes {
  id: number;
  userId: number;
  title: string;
  body: string;
  markAsReaded: boolean;
  sendDate: Date;
  userType: string;
  data: Record<string, string>;
  type: NotificationTypes;
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id'> {}

class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  declare id: number;
  declare userId: number;
  declare title: string;
  declare body: string;
  declare markAsReaded: boolean;
  declare sendDate: Date;
  declare userType: string;
  declare user: User;
  declare data: Record<string, string>;
  declare type: NotificationTypes;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    title: { type: DataTypes.STRING, allowNull: false },
    body: { type: DataTypes.STRING, allowNull: false },
    markAsReaded: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    sendDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    userType: { type: DataTypes.ENUM(...USER_TYPES), allowNull: false },
    data: { type: DataTypes.JSONB, allowNull: false },
    type: { type: DataTypes.ENUM(...Object.values(NotificationTypes)), allowNull: false },
  },
  {
    sequelize,
    timestamps: true,
    indexes: [{ fields: ['id'] }],
    tableName: 'Notification',
    modelName: 'Notification',
  },
);

Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Notification;
