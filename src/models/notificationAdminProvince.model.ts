import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import NotificationAdmin from './notificationAdmin.model.js';
import Province from './provinces.model.js';

class NotificationAdminProvince extends Model {
  declare notificationAdminId: number;
  declare provinceId: number;
}

NotificationAdminProvince.init(
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
    provinceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Province,
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    modelName: 'NotificationAdminProvince',
    tableName: 'NotificationAdminProvince',
    timestamps: false,
  },
);

export default NotificationAdminProvince;
