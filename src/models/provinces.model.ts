import { DataTypes, Model, Optional } from 'sequelize';
import Provinces from '../common/enums/provinces.enum.js';
import { sequelize } from '../DB/sequelize.js';

interface ProvincesAttributes {
  id: number;
  provinceName: Provinces;
}

interface ProvincesCreationAttributes extends Optional<ProvincesAttributes, 'id'> {}

class Province extends Model<ProvincesAttributes, ProvincesCreationAttributes> implements ProvincesAttributes {
  declare id: number;

  declare provinceName: Provinces;
}

Province.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    provinceName: {
      type: DataTypes.ENUM(...Object.values(Provinces)),
      allowNull: false,
    },
  },
  { sequelize, tableName: 'Province', timestamps: false },
);

export default Province;
