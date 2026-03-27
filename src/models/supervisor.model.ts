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
import Province from './provinces.model.js';
import { errorMessage } from '../modules/i18next.config';
import { hashPassword, comparePassword } from '../modules/bcrypt.js';
import EventType from './eventType.model.js';
import Gender from '../common/enums/gender.enum.js';
import ScannerUser from './scannerUser.model.js';
// import AppError from '../utils/AppError.js';

interface SupervisorCommonFields {
  mobileNumber?: string;
  gender?: Gender;
  birthDate?: Date;
  province?: number;
  location?: string;
  workInfo?: string;
  userId: number;
  workDocument?: string;

  getEventTypes?: BelongsToManyGetAssociationsMixin<EventType>;
  setEventTypes?: BelongsToManySetAssociationsMixin<EventType, number>;
  addEventType?: BelongsToManyAddAssociationMixin<EventType, number>;
}

interface SupervisorAttributes extends SupervisorCommonFields {
  id: number;
  username: string;
  password: string;
  deactivated?: boolean;
  blocked?: boolean;
  deletePending?: boolean;
  deletedAt?: null | Date;
  PasswordChangeDate?: null | Date;
  events?: Event[];
  acceptRateAppNotification: boolean;
}

interface SupervisorCreationAttributes extends Optional<SupervisorAttributes, 'id' | 'username'> {}

class Supervisor
  extends Model<SupervisorAttributes & SupervisorCommonFields, SupervisorCreationAttributes>
  implements SupervisorAttributes
{
  declare id: number;

  declare userId: number;

  declare mobileNumber: string;

  declare birthDate: Date;

  declare gender: Gender;

  declare username: string;

  declare password: string;

  declare province: number;

  declare location: string;

  declare workInfo: string;

  declare user?: User;

  declare deactivated?: boolean;

  declare blocked?: boolean;

  declare PasswordChangeDate?: null | Date;

  declare deletePending?: boolean;

  declare workDocument: string;

  declare events?: Event[];

  declare acceptRateAppNotification: boolean;
  declare scannerUser: ScannerUser;

  async correctPassword(candidatePassword: string): Promise<boolean> {
    return await comparePassword(candidatePassword, this.password);
  }

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

  declare setEventTypes: BelongsToManySetAssociationsMixin<EventType, number>;

  declare getEventTypes: BelongsToManyGetAssociationsMixin<EventType>;

  declare addEventType: BelongsToManyAddAssociationMixin<EventType, number>;
}

Supervisor.init(
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
      allowNull: true,
      // unique: true,
      validate: {
        isInt: {
          msg: errorMessage('error.phoneNumberTypeValidation'),
        },
        notEmpty: { msg: errorMessage('error.phoneNumberEmptyModel') },
        async isUnique(value: string) {
          const existingRecord = await Supervisor.findOne({
            where: {
              mobileNumber: value,
              deletedAt: null,
            },
          });
          if (existingRecord && existingRecord.id !== this.id) {
            throw new Error(errorMessage('error.phoneNumberAlreadyExists'));
          }
        },
      },
    },
    gender: {
      type: DataTypes.ENUM(...Object.values(Gender)),
      allowNull: true,
      validate: {
        notEmpty: { msg: errorMessage('error.maleOrFemaleOnly') },
      },
    },
    birthDate: {
      type: DataTypes.DATE,
      validate: {
        isDate: {
          args: true,
          msg: errorMessage('error.birthDateValidation'),
        },
        notEmpty: { msg: errorMessage('error.birthDateEmty') },
        isWithinAgeRange(value: string | number | Date) {
          const today = new Date();
          const birthDate = new Date(value);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age -= 1;
          }
          if (age < 18) {
            throw new Error(errorMessage('error.tooYoung'));
          }
          if (age > 85) {
            throw new Error(errorMessage('error.tooOld'));
          }
        },
      },
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        notEmpty: {
          msg: errorMessage('error.usernameEmpty'),
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: errorMessage('error.supervisorPasswordEmpty'),
        },
      },
    },
    province: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Province,
        key: 'id',
      },
      onDelete: 'RESTRICT',
      validate: {
        notEmpty: {
          msg: errorMessage('error.supervisorProvinceEmpty'),
        },
      },
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: errorMessage('error.supervisorLocationEmpty'),
        },
      },
    },
    workInfo: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: errorMessage('error.supervisorWorkInfoEmpty'),
        },
      },
    },
    workDocument: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: errorMessage('error.workDocument'),
        },
      },
    },
    deactivated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    blocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    deletePending: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    PasswordChangeDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    acceptRateAppNotification: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'Supervisor',
    timestamps: true,
    indexes: [{ fields: ['id'] }, { unique: true, fields: ['username'] }],
    paranoid: true,
    // defaultScope: {
    //   where: {
    //     deactivated: false,
    //     blocked: false,
    //   },
    // },
    getterMethods: {
      age: function () {
        const today = new Date();
        const birthdate = new Date(this.birthDate);
        let age = today.getFullYear() - birthdate.getFullYear();
        const monthDifference = today.getMonth() - birthdate.getMonth();

        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthdate.getDate())) {
          age -= 1;
        }
        return age;
      },
    },
  },
);

Supervisor.addScope('withDeactivated', {
  where: {},
});

Supervisor.beforeSave(async (superv) => {
  if (!superv.changed('password')) return;
  const plainPassword = superv.password;
  if (plainPassword.length < 10 || plainPassword.length > 25)
    throw new Error(errorMessage('error.passwordLengthError'));

  superv.password = await hashPassword(plainPassword);
});

Supervisor.beforeUpdate(async (superv) => {
  if (!superv.changed('password')) return;
  superv.PasswordChangeDate = new Date();
});

// Supervisor.beforeFind(async (superv) => {
// const supervisor = instance as Supervisor;
// });

// Supervisor.addHook('beforeSave', (instance) => {
//   const supervisor = instance as Supervisor;
//   if (supervisor.blocked) {
//     throw new AppError(errorMessage('error.blockedAccount'), 403);
//   }
// });

// Supervisor.addHook('beforeSave', (instance) => {
//   const supervisor = instance as Supervisor;
//   if (supervisor.deactivated) {
//     throw new AppError(errorMessage('error.deactivatedAccount'), 403);
//   }
// });

Supervisor.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Supervisor, { foreignKey: 'userId' });

Supervisor.belongsTo(Province, {
  foreignKey: 'province',
  as: 'provinceRelation',
});

interface PendingSupervisorChangesAttributes extends SupervisorCommonFields {
  supervisorId: number;
  isApproved: boolean;
  isRejected: boolean;
  firstName?: string;
  lastName?: string;
  workType?: number[];
}

interface PendingSupervisorChangesCreationAttributes
  extends Optional<PendingSupervisorChangesAttributes, 'isApproved' | 'isRejected'> {}

class PendingSupervisorChanges
  extends Model<PendingSupervisorChangesAttributes, PendingSupervisorChangesCreationAttributes>
  implements PendingSupervisorChangesAttributes
{
  declare userId: number;

  declare mobileNumber?: string;

  declare birthDate?: Date;

  declare gender?: Gender;

  declare province?: number;

  declare location?: string;

  declare workInfo?: string;

  declare supervisorId: number;

  declare workType?: number[];

  declare workDocument?: string;

  declare isApproved: boolean;

  declare isRejected: boolean;

  declare firstName?: string;

  declare lastName?: string;
}

PendingSupervisorChanges.init(
  {
    supervisorId: {
      type: DataTypes.INTEGER,
      references: {
        model: Supervisor,
        key: 'id',
      },
      allowNull: false,
      onDelete: 'CASCADE',
    },
    mobileNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isInt: {
          msg: errorMessage('error.phoneNumberTypeValidation'),
        },
      },
    },
    gender: {
      type: DataTypes.ENUM(...Object.values(Gender)),
      allowNull: true,
    },
    birthDate: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: {
          args: true,
          msg: errorMessage('error.birthDateValidation'),
        },
      },
    },
    province: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    workInfo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    workType: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
    },
    workDocument: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isRejected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [2, 20],
          msg: errorMessage('error.firstNameLength'),
        },
        isAlphaSpace(value: string) {
          if (!/^[a-zA-Z]/.test(value)) {
            throw new Error(errorMessage('error.firstNameValidation'));
          }
        },
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [2, 20],
          msg: errorMessage('error.lastNameLength'),
        },
        isAlphaSpace(value: string) {
          if (!/^[a-zA-Z]/.test(value)) {
            throw new Error(errorMessage('error.lastNameValidation'));
          }
        },
      },
    },
  },
  {
    sequelize,
    tableName: 'PendingSupervisorChanges',
    timestamps: true,
    indexes: [{ fields: ['id'] }],
  },
);

PendingSupervisorChanges.belongsTo(Supervisor, { foreignKey: 'supervisorId', as: 'supervisor' });
PendingSupervisorChanges.belongsTo(Province, {
  foreignKey: 'province',
  as: 'provinceRelation',
});

export { Supervisor, PendingSupervisorChanges };
