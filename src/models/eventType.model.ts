import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import { errorMessage } from '../modules/i18next.config';

interface EventTypeAttributes {
  id: number;
  typeName: string;
  description?: string;
}

interface EventTypeCreatinAttribute extends Optional<EventTypeAttributes, 'id' | 'description'> {}

class EventType extends Model<EventTypeAttributes, EventTypeCreatinAttribute> implements EventTypeAttributes {
  declare id: number;

  declare typeName: string;

  declare description?: string;
}

EventType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    typeName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Event Type Name Cannot be Empty' },
      },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      // validate: {
      //   len: {
      //     args: [3, 200],
      //     msg: errorMessage('error.eventTypeDescriptionValidation'),
      //   },
      // },
    },
  },
  { sequelize, tableName: 'EventType', timestamps: true },
);

export default EventType;
