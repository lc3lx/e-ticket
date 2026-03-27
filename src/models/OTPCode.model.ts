import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import User from './normalUser.model.js';
import AppError from '../utils/AppError.js';
import UserTypes from '../common/enums/userTypes.enum.js';
import { errorMessage } from '../modules/i18next.config.js';
import { comparePassword, hashPassword } from '../modules/bcrypt.js';

export type OtpPurpose =
  | 'signup'
  | 'login'
  | 'spervisor_password_reset'
  | 'scanner_password_reset'
  | 'supervisor_login'
  | 'supervisor_forget_password';

interface OtpCodeAttributes {
  id: number;
  userId?: number | null;
  userType: UserTypes;
  mobileNumber: string;
  codeHash: string;
  purpose: OtpPurpose;
  expiresAt: Date;
  nextAllowed: Date;
  verifiedAt?: Date | null;
  retries?: number;
  minutesToWait?: number;
  signupData?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OtpCodeCreationAttributes
  extends Optional<OtpCodeAttributes, 'id' | 'userId' | 'verifiedAt' | 'signupData' | 'createdAt' | 'updatedAt'> {}

class OtpCode extends Model<OtpCodeAttributes, OtpCodeCreationAttributes> implements OtpCodeAttributes {
  declare id: number;
  declare userId: number | null;
  declare userType: UserTypes;
  declare mobileNumber: string;
  declare codeHash: string;
  declare purpose: OtpPurpose;
  declare expiresAt: Date;
  declare nextAllowed: Date;
  declare retries?: number;
  declare minutesToWait?: number;
  declare verifiedAt: Date | null;
  declare signupData: Record<string, any> | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public isExpired(): boolean {
    return this.expiresAt.getTime() < Date.now();
  }
  public isVerified(): boolean {
    return !!this.verifiedAt;
  }

  async correctOTPCode(candidatePassword: string): Promise<boolean> {
    return await comparePassword(candidatePassword, this.codeHash);
  }
}

OtpCode.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    userType: { type: DataTypes.ENUM(...Object.values(UserTypes)), allowNull: false },
    mobileNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'phoneNumberEmptyModel' },
        notNull: { msg: 'phoneNumberEmptyModel' },
        isValidSyrianMobile(value: string) {
          if (value) {
            if (!/^\d+$/.test(value)) throw new AppError('phoneNumberTypeValidation', 400);
            if (!value.startsWith('963')) throw new AppError('phoneNumberCountryCode', 400);
            if (value.length !== 12) throw new AppError('phoneNumberLength', 400);
            if (!/^963\d{9}$/.test(value)) throw new AppError('phoneNumberNotValid', 400);
          }
        },
      },
    },
    codeHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    purpose: {
      type: DataTypes.ENUM('signup', 'login', 'spervisor_password_reset', 'scanner_password_reset', 'supervisor_login'),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    nextAllowed: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    retries: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    minutesToWait: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    signupData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'OtpCodes',
    timestamps: true,
    indexes: [{ fields: ['mobileNumber'] }, { fields: ['purpose'] }, { fields: ['expiresAt'] }],
  },
);

OtpCode.beforeSave(async (otp) => {
  if (!otp.changed('codeHash')) return;
  const plainCode = otp.codeHash;
  if (plainCode.length !== 6) {
    throw new Error(errorMessage('error.OTPLengthError'));
  }
  otp.codeHash = await hashPassword(plainCode);
});

OtpCode.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(OtpCode, { foreignKey: 'userId', as: 'otpCodes' });

export default OtpCode;
