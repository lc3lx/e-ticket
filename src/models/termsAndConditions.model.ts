import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';

interface TermsAndConditionsAttributes {
  id: number;
  content: string;
  language: 'ar' | 'en';
}

interface TermsAndConditionsCreationAttributes extends Optional<TermsAndConditionsAttributes, 'id'> {}

class TermsAndConditions
  extends Model<TermsAndConditionsAttributes, TermsAndConditionsCreationAttributes>
  implements TermsAndConditionsAttributes
{
  declare id: number;

  declare content: string;

  declare language: 'ar' | 'en';

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

TermsAndConditions.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    language: {
      type: DataTypes.ENUM(...['ar', 'en']),
      allowNull: false,
    },
  },
  {
    sequelize: sequelize,
    modelName: 'TermsAndConditions',
    tableName: 'Terms_Conditions',
    timestamps: true,
  },
);

export default TermsAndConditions;
