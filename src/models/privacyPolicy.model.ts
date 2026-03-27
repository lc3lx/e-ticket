import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';

interface PrivacyPolicyAttributes {
  id: number;
  content: string;
  language: 'en' | 'ar';
}

interface PrivacyPolicyCreationAttributes extends Optional<PrivacyPolicyAttributes, 'id'> {}

class PrivacyPolicy
  extends Model<PrivacyPolicyAttributes, PrivacyPolicyCreationAttributes>
  implements PrivacyPolicyAttributes
{
  declare id: number;

  declare content: string;

  declare language: 'en' | 'ar';

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

PrivacyPolicy.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Content cannot be empty.' },
      },
    },
    language: {
      type: DataTypes.ENUM(...['ar', 'en']),
      allowNull: false,
    },
  },
  {
    sequelize: sequelize,
    modelName: 'PrivacyPolicy',
    tableName: 'Privacy_Policy',
    timestamps: true,
  },
);

export default PrivacyPolicy;
