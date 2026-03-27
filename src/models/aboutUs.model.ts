import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';

interface AboutUsAttributes {
  id: number;
  // content: string;
  callCenterMobileNumber: string;
  callCenterTelePhoneLineNumber?: string;
  email: string;
  website: string;
}

interface AboutUsCreationAttributes extends Optional<AboutUsAttributes, 'id'> {}

class AboutUs extends Model<AboutUsAttributes, AboutUsCreationAttributes> implements AboutUsAttributes {
  declare id: number;
  declare callCenterMobileNumber: string;
  declare callCenterTelePhoneLineNumber?: string;
  declare email: string;
  declare website: string;
}

AboutUs.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    callCenterMobileNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Call center number cannot be empty.' },
        isNumeric: { msg: 'Call center number must contain only numbers.' },
      },
    },
    callCenterTelePhoneLineNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        notEmpty: { msg: 'Call center number cannot be empty.' },
        isNumeric: { msg: 'Call center number must contain only numbers.' },
      },
    },
    website: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Webiste cannot be empty.' },
        isUrl: { msg: 'Website Must be a URL' },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Email cannot be empty.' },
        isEmail: { msg: 'Email must be a valid email address.' },
        // isSpecificDomain(value: string) {
        //   const domain = process.env.DOMAIN_NAME || 'e-ticket.sy';
        //   if (!value.endsWith(`@${domain}`)) {
        //     throw new Error(`Email must belong to the domain "${domain}".`);
        //   }
        // },
      },
    },
  },
  {
    sequelize: sequelize,
    modelName: 'AboutUs',
    tableName: 'About_Us',
    timestamps: true,
  },
);

export default AboutUs;
