'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Ticket', 'scans', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      // validate: {
      //   isNull: { msg: 'scans number cannot be empty' },
      //   isNumeric: { msg: 'it must be a number' },
      // },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Ticket', 'scans');
  },
};
