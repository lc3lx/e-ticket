import { Model, DataTypes, Optional, Association } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import { errorMessage } from '../modules/i18next.config.js';
import { Supervisor } from './supervisor.model.js';
import { hashPassword, comparePassword } from '../modules/bcrypt.js';

interface ScannerUserAttributes {
  id: number;
  // mobileNumber: string;
  name: string;
  scannerUserPhoto?: string;
  password: string;
  supervisorId: number;
  // deletedAt?: null | Date;
  PasswordChangeDate?: null | Date;
  deactivated?: boolean;

  supervisor?: any;
}

//id, username: related to supervisor ? , password or OTP or both, supervisorId

interface ScannerUserCreationAttributes extends Optional<ScannerUserAttributes, 'id'> {}

class ScannerUser extends Model<ScannerUserAttributes, ScannerUserCreationAttributes> implements ScannerUserAttributes {
  declare id: number;
  // declare mobileNumber: string;
  declare name: string;
  declare scannerUserPhoto?: string;
  declare password: string;
  declare supervisorId: number;
  // declare deletedAt?: null | Date;
  declare PasswordChangeDate?: null | Date;
  declare deactivated?: boolean;

  async correctPassword(candidatePassword: string): Promise<boolean> {
    return await comparePassword(candidatePassword, this.password);
  }

  public readonly supervisor?: Supervisor;

  static associations: {
    supervisor: Association<ScannerUser, Supervisor>;
  };
}

ScannerUser.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: errorMessage('error.scannerUserNameRequired') },
      },
    },
    scannerUserPhoto: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: errorMessage('error.scannerUserPasswordEmpty'),
        },
      },
    },
    deactivated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    PasswordChangeDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    supervisorId: {
      type: DataTypes.INTEGER,
      references: {
        model: Supervisor,
        key: 'id',
      },
      allowNull: false,
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'ScannerUser',
    timestamps: true,
    indexes: [{ fields: ['id'] }, { unique: true, fields: ['name'] }],
  },
);

ScannerUser.beforeSave(async (scannerUser) => {
  if (!scannerUser.changed('password')) return;
  const plainPassword = scannerUser.password;
  if (plainPassword.length < 10 || plainPassword.length > 25)
    throw new Error(errorMessage('error.passwordLengthError'));

  scannerUser.password = await hashPassword(plainPassword);
});

export default ScannerUser;
