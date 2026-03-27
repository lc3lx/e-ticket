import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import { errorMessage } from '../modules/i18next.config';
import AppError from '../utils/AppError.js';

interface UserAttributes {
  id: number;
  firstName: string;
  lastName: string;
  isDeleted?: boolean;
  isBlocked?: boolean;
  blockedAt?: Date;
  lastLogin?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'isDeleted' | 'isBlocked' | 'blockedAt' | 'lastLogin'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;

  declare firstName: string;

  declare lastName: string;

  declare isDeleted?: boolean;

  declare isBlocked?: boolean;

  declare blockedAt?: Date;

  declare lastLogin?: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [2, 20],
          msg: 'firstNameLength',
        },
        notEmpty: {
          msg: 'firstNameEmpty',
        },
        notNull: { msg: 'firstNameEmpty' },
        isAlphaSpace(value: string) {
          if (!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(value)) {
            throw new Error('firstNameValidation');
          }
        },
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [2, 20],
          msg: 'lastNameLength',
        },
        notEmpty: {
          msg: 'lastNameEmpty',
        },
        isAlphaSpace(value: string) {
          if (!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(value)) {
            throw new Error('lastNameValidation');
          }
        },
      },
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      validate: {
        isIn: {
          args: [[true, false]],
          msg: 'bad value for delete user',
        },
      },
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      validate: {
        isIn: {
          args: [[true, false]],
          msg: 'bad value for block user',
        },
      },
    },
    blockedAt: {
      type: DataTypes.DATE,
      validate: {
        isDate: {
          args: true,
          msg: 'blockedAt must be a valid date',
        },
        isBlockedBeforeSet(value: Date) {
          if (this.isBlocked && !value) {
            throw new Error('blockedAt date must be provided if the user is blocked.');
          }
        },
      },
    },
    lastLogin: {
      type: DataTypes.DATE,
      validate: {
        isDate: {
          args: true,
          msg: 'last Login must be a valid date',
        },
      },
    },
  },
  {
    sequelize,
    tableName: 'User',
    timestamps: true,
    indexes: [{ fields: ['id'] }],

    paranoid: true,
    defaultScope: { where: { isDeleted: false, isBlocked: false } },
    scopes: {
      withDeleted: { where: { isDeleted: true, isBlocked: false } },
      withBlocked: { where: { isBlocked: true, isDeleted: false } },
      withAll: { where: {} },
    },
  },
);

User.beforeCreate((user, options) => {
  if (!user.lastLogin) {
    user.lastLogin = new Date();
  }
});

User.beforeUpdate((user, options) => {
  if (user.isBlocked && !user.blockedAt) {
    user.blockedAt = new Date();
  } else if (!user.isBlocked && user.blockedAt) {
    user.blockedAt = undefined;
  }
});

User.beforeValidate((user, options) => {
  if (typeof user.firstName === 'string') {
    user.firstName = user.firstName.trim();
  }
  if (typeof user.lastName === 'string') {
    user.lastName = user.lastName.trim();
  }
});

User.beforeDestroy(async (instance, options) => {
  if (instance.id === 1) {
    throw new AppError('Cannot delete the superadmin user', 403);
  }
});

export default User;
