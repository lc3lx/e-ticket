import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
import AboutUs from './aboutUs.model.js';

interface AboutUsTranslationAttributes {
  id: number;
  aboutUsId: number;
  language: 'en' | 'ar';
  content: string;
}

interface AboutUsTranslationCreationAttributes extends Optional<AboutUsTranslationAttributes, 'id'> {}

class AboutUsTranslation
  extends Model<AboutUsTranslationAttributes, AboutUsTranslationCreationAttributes>
  implements AboutUsTranslationAttributes
{
  declare id: number;
  declare aboutUsId: number;
  declare language: 'en' | 'ar';
  declare content: string;
}

AboutUsTranslation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    aboutUsId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'About_Us',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    language: {
      type: DataTypes.ENUM('en', 'ar'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'AboutUsTranslation',
    tableName: 'About_Us_Translation',
    timestamps: true,
  },
);

AboutUs.hasMany(AboutUsTranslation, { foreignKey: 'aboutUsId', as: 'translations' });
AboutUsTranslation.belongsTo(AboutUs, { foreignKey: 'aboutUsId', as: 'aboutUs' });

export default AboutUsTranslation;
