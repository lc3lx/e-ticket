import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
// import NormalUser from './normalUser.model.js';
import User from './user.model.js';

interface UserDeviceAttributes {
  id: number;
  userId: number;
  fcmToken: string;
  platform: 'android' | 'ios';
  deviceId?: string;
  appVersion?: string;
  lastActiveAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

type UserDeviceCreationAttributes = Optional<
  UserDeviceAttributes,
  'id' | 'deviceId' | 'appVersion' | 'lastActiveAt' | 'createdAt' | 'updatedAt'
>;

class UserDevice extends Model<UserDeviceAttributes, UserDeviceCreationAttributes> implements UserDeviceAttributes {
  declare id: number;
  declare userId: number;
  declare fcmToken: string;
  declare platform: 'android' | 'ios';
  declare deviceId?: string;
  declare appVersion?: string;
  declare lastActiveAt?: Date;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

UserDevice.init(
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
    },
    fcmToken: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    platform: {
      type: DataTypes.ENUM('android', 'ios'),
      allowNull: false,
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    appVersion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastActiveAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    sequelize,
    modelName: 'UserDevice',
    tableName: 'user_devices',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'fcmToken'],
      },
    ],
  },
);

export default UserDevice;
