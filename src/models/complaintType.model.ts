import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';

interface ComlaintTypeAttributes {
  id: number;
  complaintName: string;
}

interface ComplaintTypeCreatinAttribute extends Optional<ComlaintTypeAttributes, 'id'> {}

class ComplaintType
  extends Model<ComlaintTypeAttributes, ComplaintTypeCreatinAttribute>
  implements ComlaintTypeAttributes
{
  declare id: number;

  declare complaintName: string;
}

ComplaintType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    complaintName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  { sequelize, tableName: 'ComplaintType', timestamps: true },
);

export default ComplaintType;
