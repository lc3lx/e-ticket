import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';

interface WhatsAppSessionAttributes {
  id: number;
  sessionKey: string;
  sessionData: Record<string, any> | null;
  qrCode: string | null;
  isReady: boolean;
  lastConnectedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WhatsAppSessionCreationAttributes extends Optional<WhatsAppSessionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class WhatsAppSession
  extends Model<WhatsAppSessionAttributes, WhatsAppSessionCreationAttributes>
  implements WhatsAppSessionAttributes
{
  declare id: number;

  declare sessionKey: string;

  declare sessionData: Record<string, any> | null;

  declare qrCode: string | null;

  declare isReady: boolean;

  declare lastConnectedAt: Date | null;

  declare readonly createdAt: Date;

  declare readonly updatedAt: Date;
}

WhatsAppSession.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sessionKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    sessionData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    qrCode: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isReady: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lastConnectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'WhatsAppSessions',
    timestamps: true,
    indexes: [{ unique: true, fields: ['sessionKey'] }],
  },
);

export default WhatsAppSession;
