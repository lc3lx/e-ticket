import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import User from './user.model.js';
import AdminTypes from '../common/enums/adminTypes.enum.js';
import { hashPassword, comparePassword } from '../modules/bcrypt.js';
import { errorMessage } from '../modules/i18next.config';
import AppError from '../utils/AppError.js';

interface DashboardAdminAttributes {
  id: number;
  userId: number;
  role: string;
  email: string;
  password: string;
  blocked?: boolean;
}

interface DashboardAdminCreationAttributes extends Optional<DashboardAdminAttributes, 'id'> {}

class DashboardAdmin
  extends Model<DashboardAdminAttributes, DashboardAdminCreationAttributes>
  implements DashboardAdminAttributes
{
  declare id: number;

  declare userId: number;

  declare role: string;

  declare email: string;

  declare password: string;

  declare user: User;

  declare blocked?: boolean;

  async correctPassword(candidatePassword: string): Promise<boolean> {
    return await comparePassword(candidatePassword, this.password);
  }
}

DashboardAdmin.init(
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
    role: {
      type: DataTypes.ENUM(...Object.values(AdminTypes)),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'it Must be a valid email address',
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    blocked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    sequelize,
    tableName: 'DashboardAdmin',
    timestamps: true,
    indexes: [{ fields: ['id'] }, { unique: true, fields: ['email'] }],
  },
);

DashboardAdmin.beforeDestroy(async (instance, options) => {
  if (instance.id === 1) {
    throw new AppError('Cannot delete the superadmin account', 403);
  }
});
DashboardAdmin.beforeUpdate(async (instance, options) => {
  if (instance.id === 1 || instance.role === 'superadmin') {
    throw new AppError('Cannot modify the superadmin account', 403);
  }
  if (instance.changed('role') && instance.role === 'superadmin') {
    throw new AppError('Cannot change role to superadmin', 403);
  }
});
DashboardAdmin.beforeSave(async (admin) => {
  if (!admin.changed('password')) return;
  const plainPassword = admin.password;
  if (plainPassword.length < 10 || plainPassword.length > 25) {
    throw new Error(errorMessage('error.passwordLengthError'));
  }
  admin.password = await hashPassword(plainPassword);
});
DashboardAdmin.beforeSave(async (instance, options) => {
  if (instance.id !== 1 && instance.role === 'superadmin') {
    throw new AppError('Cannot create new superadmin', 403);
  }
});

DashboardAdmin.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default DashboardAdmin;
