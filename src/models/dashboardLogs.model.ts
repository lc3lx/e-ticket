// src/models/DashboardLog.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';

export interface DashboardLogAttributes {
  id: number;
  userName?: string | null;
  role?: string | null;
  action: string;
  url: string;
  method: string;
  data?: object | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DashboardLogCreationAttributes
  extends Optional<DashboardLogAttributes, 'id' | 'userName' | 'role' | 'data'> {}

class DashboardLog
  extends Model<DashboardLogAttributes, DashboardLogCreationAttributes>
  implements DashboardLogAttributes
{
  declare id: number;
  declare userName?: string | null;
  declare role?: string | null;
  declare action: string;
  declare url: string;
  declare method: string;
  declare data?: object | null;
  declare createdAt?: Date;
  declare updatedAt?: Date;
}

DashboardLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    method: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'DashboardLogs',
    modelName: 'DashboardLogs',
    timestamps: true,
  },
);

export default DashboardLog;
