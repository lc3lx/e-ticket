import { Model, DataTypes, Optional, BelongsToGetAssociationMixin, Association } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import User from './normalUser.model.js';
import Event from './event.model.js';
import ComplainType from './complaintType.model.js';

interface ComplainAttributes {
  id: number;
  userId: number;
  eventId: number;
  complainTypeId: number | null;
  customComplain?: string | null;
  isReaded?: boolean;
}

interface ComplainCreationAttributes extends Optional<ComplainAttributes, 'id' | 'customComplain'> {}

class Complain extends Model<ComplainAttributes, ComplainCreationAttributes> implements ComplainAttributes {
  declare id: number;

  declare userId: number;

  declare eventId: number;

  declare complainTypeId: number | null;

  declare customComplain?: string | null;

  declare isReaded?: boolean;

  public getUser!: BelongsToGetAssociationMixin<User>;

  public getEvent!: BelongsToGetAssociationMixin<Event>;

  public getComplainType!: BelongsToGetAssociationMixin<ComplainType>;

  public static associations: {
    user: Association<Complain, User>;
    event: Association<Complain, Event>;
    complainType: Association<Complain, ComplainType>;
  };
}

Complain.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    complainTypeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    customComplain: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isReaded: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'Complain',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'eventId'],
      },
    ],
  },
);

Complain.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Complain.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });
Complain.belongsTo(ComplainType, { foreignKey: 'complainTypeId', as: 'complainType' });

export default Complain;
