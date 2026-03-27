import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import Province from './provinces.model.js';
import NormalUser from './normalUser.model.js';
import AppError from '../utils/AppError.js';

interface UserProvinceAttributes {
  userId: number;
  provinceId: number;
}

class UserProvince extends Model<UserProvinceAttributes> implements UserProvinceAttributes {
  declare userId: number;

  declare provinceId: number;
}

UserProvince.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      // allowNull: false,
      references: {
        model: NormalUser,
        key: 'id',
      },
    },
    provinceId: {
      type: DataTypes.INTEGER,
      // allowNull: false,
      references: {
        model: Province,
        key: 'id',
      },
      validate: {
        isPositive(value: number) {
          if (value <= 0) throw new AppError('normalUserProvinces', 400);
        },
      },
    },
  },
  {
    sequelize,
    tableName: 'UserProvince',
    timestamps: true,
    indexes: [{ unique: true, fields: ['userId', 'provinceId'] }],
  },
);

export default UserProvince;

