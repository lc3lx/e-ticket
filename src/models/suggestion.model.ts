import { Model, DataTypes, Optional, BelongsToGetAssociationMixin } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import User from './normalUser.model.js';
import Event from './event.model.js';

interface SuggestionAttributes {
  id: number;
  userId: number;
  eventId: number;
  suggestionText: string;
}

interface SuggestionCreationAttributes extends Optional<SuggestionAttributes, 'id'> {}

class Suggestion extends Model<SuggestionAttributes, SuggestionCreationAttributes> implements SuggestionAttributes {
  declare id: number;

  declare userId: number;

  declare eventId: number;

  declare suggestionText: string;

  declare getUser: BelongsToGetAssociationMixin<User>;

  declare getEvent: BelongsToGetAssociationMixin<Event>;
}

Suggestion.init(
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
    suggestionText: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'suggestion Text Cannot be Empty',
        },
      },
    },
  },
  {
    sequelize,
    tableName: 'Suggestions',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'eventId'],
      },
    ],
  },
);

Suggestion.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Suggestion.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

export default Suggestion;

