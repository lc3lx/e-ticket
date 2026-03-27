'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Change answer to TEXT
    await queryInterface.changeColumn('FAQ', 'answer', {
      type: Sequelize.TEXT,
      allowNull: false,
    });

    // 2. Add userType enum
    await queryInterface.addColumn('FAQ', 'userType', {
      type: Sequelize.ENUM('supervisor', 'normalUser'),
      allowNull: true,
    });

    // 1. Drop unique constraint if it exists
    await queryInterface.removeConstraint('FAQ', 'FAQ_question_key').catch(() => {});

    // 2. Change question to STRING WITHOUT unique
    await queryInterface.changeColumn('FAQ', 'question', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // 1. Remove userType
    await queryInterface.removeColumn('FAQ', 'userType');

    // 2. Drop ENUM type created by Sequelize
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_FAQ_userType";
    `);

    // 3. Revert answer back to string (VARCHAR)
    await queryInterface.changeColumn('FAQ', 'answer', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn('FAQ', 'question', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
  },
};
