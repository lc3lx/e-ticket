import { Model, DataTypes, Optional, ForeignKey } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import Event from './event.model.js';
import NormalUser from './normalUser.model.js';

interface RatieEventAttributes {
  id: number;
  userId: number;
  eventId: number;
  rating: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RateEventCreationAttributes extends Optional<RatieEventAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class RateEvent extends Model<RatieEventAttributes, RateEventCreationAttributes> implements RatieEventAttributes {
  declare id: number;
  declare userId: ForeignKey<NormalUser['id']>;
  declare eventId: ForeignKey<Event['id']>;
  declare rating: number;
  declare createdAt?: Date;
  declare updatedAt?: Date;
}

RateEvent.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: NormalUser,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Event,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 5,
      },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'RateEvent',
    modelName: 'RateEvent',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'eventId'],
      },
    ],
    timestamps: true,
  },
);

RateEvent.belongsTo(NormalUser, { foreignKey: 'userId', as: 'user' });
// RateEvent.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

export default RateEvent;
