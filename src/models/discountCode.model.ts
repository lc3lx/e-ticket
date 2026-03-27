import { Model, DataTypes, Optional } from 'sequelize';
import { Op } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import Event from './event.model.js';
import { errorMessage } from '../modules/i18next.config.js';

interface DiscountCodeAttributes {
  id: number;
  code: string;
  isPercent: boolean;
  isFixedValue: boolean;
  value: number;
  eventId: number;
  startFrom: Date;
  endAt: Date;
  isDisabled: boolean;
  usageLimit?: number;
  usageCount?: number;
}

interface DiscountCodeCreationAttributes extends Optional<DiscountCodeAttributes, 'id'> {}

class DiscountCode
  extends Model<DiscountCodeAttributes, DiscountCodeCreationAttributes>
  implements DiscountCodeAttributes
{
  declare id: number;
  declare code: string;
  declare isPercent: boolean;
  declare isFixedValue: boolean;
  declare value: number;
  declare eventId: number;
  declare startFrom: Date;
  declare endAt: Date;
  declare isDisabled: boolean;
  usageLimit?: number;
  usageCount?: number;

  public static async isCodeUnique(code: string, eventId: number, excludeId?: number): Promise<boolean> {
    const where: any = { code, eventId };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const existing = await this.findOne({ where });
    return !existing;
  }
}

DiscountCode.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'discountCodeRequired' },
        len: {
          args: [3, 20],
          msg: 'discountCodeLength',
          // msg: 'discountCodeLength')
        },
        is: {
          args: /^[a-zA-Z0-9!@#$%&]+$/i,
          msg: 'discountCodeFormat',
        },
      },
    },
    isPercent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      validate: {
        notNull: { msg: 'discountTypeRequired' },
      },
    },
    isFixedValue: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      validate: {
        notNull: { msg: 'discountTypeRequired' },
      },
    },
    value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: 'discountValueRequired' },
        min: {
          args: [1],
          msg: 'discountValueMin',
        },
        notEmpty: { msg: errorMessage('error.valueCannot be empty') },
        isValidPercent(value: number) {
          if (this.isPercent && (value < 1 || value > 100)) {
            throw new Error('discountPercentRange');
          }
        },
      },
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Event,
        key: 'id',
      },
      onDelete: 'CASCADE',
      validate: {
        notNull: { msg: errorMessage('error.eventIdRequired') },
      },
    },
    startFrom: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notNull: { msg: errorMessage('error.startfrom Cannot be empty') },
        isDate: { args: true, msg: errorMessage('error.startFromInvalid') },
        isFuture(value: Date) {
          if (new Date(value) < new Date()) {
            throw new Error('startFromFuture');
          }
        },
      },
    },
    endAt: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notNull: { msg: errorMessage('error.end at Cannot be empty') },
        isDate: { args: true, msg: errorMessage('error.endAtInvalid') },
        isAfterStartFrom(value: Date) {
          const discountCode = this as unknown as DiscountCode;
          if (value <= discountCode.startFrom) {
            throw new Error('endAtAfterStartFrom');
          }
        },
      },
    },
    isDisabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      validate: {
        notEmpty: { msg: errorMessage('error.isdisabled Cannot be empty') },
      },
    },
    usageLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      validate: {
        min: { args: [1], msg: 'usageLimitMin' },
      },
    },
    usageCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'DiscountCode',
    timestamps: true,
    indexes: [{ fields: ['code', 'eventId'], unique: true }],
  },
);

DiscountCode.belongsTo(Event, {
  foreignKey: 'eventId',
  as: 'event',
});

DiscountCode.beforeValidate(async (discountCode) => {
  const { isPercent, isFixedValue } = discountCode;
  if (isPercent === isFixedValue) {
    throw new Error(errorMessage('error.invalidDiscountType'));
  }
  if (discountCode.code && discountCode.eventId) {
    const isUnique = await DiscountCode.isCodeUnique(discountCode.code, discountCode.eventId, discountCode.id);
    if (!isUnique) {
      throw new Error(errorMessage('error.discountCodeUnique'));
    }
  }
});

export default DiscountCode;
