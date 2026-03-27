import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';

interface FAQAttribute {
  id: number;
  question: string;
  answer: string;
  order: number;
  userType: 'supervisor' | 'normalUser';
}

interface FAQCreationAttribute extends Optional<FAQAttribute, 'id'> {}

class FAQ extends Model<FAQAttribute, FAQCreationAttribute> implements FAQAttribute {
  declare id: number;
  declare question: string;
  declare answer: string;
  declare order: number;
  declare userType: 'supervisor' | 'normalUser';
}

FAQ.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    question: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false,
      validate: {
        notEmpty: { msg: 'question cannot be empty' },
        isUnique: async function (value: string) {
          const self = this as unknown as FAQ;
          const exists = await FAQ.findOne({
            where: {
              question: value,
              id: { [Op.ne]: self.id },
              userType: self.userType,
            },
          });
          if (exists) {
            throw new Error('This question already exists');
          }
        },
      },
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'answer cannot be empty' },
      },
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'u must add order to the question' },
        isInt: { msg: 'Order must be an integer' },
      },
    },
    userType: {
      type: DataTypes.ENUM('supervisor', 'normalUser'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['supervisor', 'normalUser']],
          msg: 'userType must be either supervisor or normalUser',
        },
      },
    },
  },
  { sequelize, tableName: 'FAQ', timestamps: true },
);

FAQ.beforeValidate((faq) => {
  if (faq.question) faq.question = faq.question.trim();
  if (faq.answer) faq.answer = faq.answer.trim();
});

export default FAQ;
