import {
  Model,
  DataTypes,
  Optional,
  BelongsToManySetAssociationsMixin,
  BelongsToManyGetAssociationsMixin,
} from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import Gender from '../common/enums/gender.enum.js';
import EventType from './eventType.model.js';
import Province from './provinces.model.js';

const USER_TYPES = ['supervisor', 'normalUser'] as const;

interface NotificationAdminAttributes {
  id: number;
  title: string;
  body: string;
  sendDate?: Date;
  targetedUsersType: string;
  gender?: Gender | null;
  minAge?: number | null;
  maxAge?: number | null;

  setEventTypes?: BelongsToManySetAssociationsMixin<EventType, number>;
  getEventTypes?: BelongsToManyGetAssociationsMixin<EventType>;

  setProvinces?: BelongsToManySetAssociationsMixin<Province, number>;
  getProvinces?: BelongsToManyGetAssociationsMixin<Province>;
}

interface NotificationAdminCreationAttributes extends Optional<NotificationAdminAttributes, 'id'> {}

class NotificationAdmin
  extends Model<NotificationAdminAttributes, NotificationAdminCreationAttributes>
  implements NotificationAdminAttributes
{
  declare id: number;
  declare title: string;
  declare body: string;
  declare sendDate?: Date;
  declare targetedUsersType: string;
  declare gender?: Gender | null;
  declare minAge?: number | null;
  declare maxAge?: number | null;

  declare setEventTypes: BelongsToManySetAssociationsMixin<EventType, number>;
  declare getEventTypes: BelongsToManyGetAssociationsMixin<EventType>;

  declare setProvinces: BelongsToManySetAssociationsMixin<Province, number>;
  declare getProvinces: BelongsToManyGetAssociationsMixin<Province>;
}

NotificationAdmin.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: { type: DataTypes.STRING, allowNull: false },
    body: { type: DataTypes.STRING, allowNull: false },
    sendDate: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    targetedUsersType: { type: DataTypes.ENUM(...USER_TYPES), allowNull: false },
    gender: { type: DataTypes.ENUM(...[...Object.values(Gender)]), allowNull: true },
    minAge: { type: DataTypes.INTEGER, allowNull: true },
    maxAge: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    timestamps: true,
    modelName: 'NotificationAdmin',
    tableName: 'NotificationAdmin',
    indexes: [{ fields: ['id'] }],
  },
);

export default NotificationAdmin;
