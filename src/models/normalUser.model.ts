import {
  DataTypes,
  Model,
  Optional,
  BelongsToManySetAssociationsMixin,
  BelongsToManyGetAssociationsMixin,
  BelongsToManyAddAssociationMixin,
} from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import User from './user.model.js';
import Gender from '../common/enums/gender.enum.js';
import EventType from './eventType.model.js';
import Province from './provinces.model.js';
import { errorMessage } from '../modules/i18next.config';
import AppError from '../utils/AppError.js';

interface NormalUserAttributes {
  id: number;
  userId: number;
  eventTypes?: EventType[];
  provinces?: Province[];
  mobileNumber: string;
  profilePicture?: string;
  gender: Gender;
  birthDate: Date;
  acceptRateAppNotification: boolean;
  blocked?: boolean;

  createdAt?: Date;
  updatedAt?: Date;

  getEventTypes?: BelongsToManyGetAssociationsMixin<EventType>;
  setEventTypes?: BelongsToManySetAssociationsMixin<EventType, number>;
  addEventType?: BelongsToManyAddAssociationMixin<EventType, number>;

  getProvinces?: BelongsToManyGetAssociationsMixin<Province>;
  setProvinces?: BelongsToManySetAssociationsMixin<Province, number>;
  addProvince?: BelongsToManyAddAssociationMixin<Province, number>;
}

interface NormalUserCreationAttributes extends Optional<NormalUserAttributes, 'id'> {}

class NormalUser extends Model<NormalUserAttributes, NormalUserCreationAttributes> implements NormalUserAttributes {
  declare id: number;
  declare userId: number;
  declare eventTypes?: EventType[];
  declare provinces?: Province[];
  declare mobileNumber: string;
  declare profilePicture?: string;
  declare gender: Gender;
  declare birthDate: Date;
  declare user?: User;
  declare acceptRateAppNotification: boolean;
  declare blocked?: boolean;

  public get age(): number {
    const today = new Date();
    const birthdate = new Date(this.birthDate);
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDifference = today.getMonth() - birthdate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthdate.getDate())) {
      age -= 1;
    }
    return age;
  }

  declare setProvinces: BelongsToManySetAssociationsMixin<Province, number>;

  declare getProvinces: BelongsToManyGetAssociationsMixin<Province>;

  declare addProvince: BelongsToManyAddAssociationMixin<Province, number>;

  declare setEventTypes: BelongsToManySetAssociationsMixin<EventType, number>;

  declare getEventTypes: BelongsToManyGetAssociationsMixin<EventType>;

  declare addEventType: BelongsToManyAddAssociationMixin<EventType, number>;
}

NormalUser.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'id',
      },
      allowNull: false,
      onDelete: 'CASCADE',
    },
    mobileNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: { name: 'mobile_number_unique-constrain', msg: 'phoneNumberExist' },
      validate: {
        notEmpty: { msg: 'phoneNumberEmptyModel' },
        notNull: { msg: 'phoneNumberEmptyModel' },
        isValidSyrianMobile(value: string) {
          if (value) {
            if (!/^\d+$/.test(value)) throw new AppError('phoneNumberTypeValidation', 400);
            if (!value.startsWith('963')) throw new Error('phoneNumberCountryCode');
            if (value.length !== 12) throw new Error('phoneNumberLength');
            if (!/^963\d{9}$/.test(value)) throw new Error('phoneNumberNotValid');
          }
        },
      },
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM(...Object.values(Gender)),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'maleOrFemaleOnly' },
        notNull: { msg: 'maleOrFemaleOnly' },
      },
    },
    birthDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: {
          args: true,
          msg: 'birthDateValidation',
        },
        notEmpty: { msg: 'birthDateEmty' },
        notNull: { msg: 'birthDateEmty' },
        isWithinAgeRange(value: string | number | Date) {
          const today = new Date();
          const birthDate = new Date(value);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age -= 1;
          }
          if (age < 18) {
            throw new Error('tooYoung');
          }
          if (age > 85) {
            throw new Error('tooOld');
          }
        },
      },
    },
    acceptRateAppNotification: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    blocked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    sequelize,
    tableName: 'NormalUser',
    timestamps: true,
    indexes: [{ fields: ['id'] }, { unique: true, fields: ['mobileNumber'] }],
  },
);

NormalUser.addHook('beforeSave', (instance) => {
  const user = instance as NormalUser;

  if (user.changed('blocked') && Object.keys(user.changed()).length === 1) {
    return; // allow admin to block/unblock
  }

  if (user.blocked) {
    throw new AppError(errorMessage('error.blockedAccount'), 403);
  }
});

NormalUser.addHook('beforeDestroy', (instance) => {
  const user = instance as NormalUser;
  if (user.blocked) {
    throw new AppError(errorMessage('error.blockedAccount'), 403);
  }
});

NormalUser.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(NormalUser, { foreignKey: 'userId' });

export default NormalUser;
