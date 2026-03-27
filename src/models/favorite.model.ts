import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import NormalUser from './normalUser.model.js';
import Event from './event.model.js';

interface FavouriteAttributes {
  userId: number;
  eventId: number;
}

class Favorite extends Model<FavouriteAttributes> implements FavouriteAttributes {
  declare userId: number;

  declare eventId: number;
}

Favorite.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: NormalUser,
        key: 'id',
      },
    },
    eventId: {
      type: DataTypes.INTEGER,
      references: {
        model: Event,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'Favorite',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'eventId'],
      },
    ],
  },
);

Favorite.belongsTo(NormalUser, {
  foreignKey: 'userId',
  as: 'userFavourite',
});
Favorite.belongsTo(Event, {
  foreignKey: 'eventId',
  as: 'eventFavourite',
});

export default Favorite;
