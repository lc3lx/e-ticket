'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ScannerUser', 'mobileNumber');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('ScannerUser', 'mobileNumber', {
      type: Sequelize.STRING,
      allowNull: false,
      // defaultValue: 0,
    });
  },
};

