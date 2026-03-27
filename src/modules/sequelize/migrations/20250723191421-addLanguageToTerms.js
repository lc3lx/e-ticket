'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Terms_Conditions', 'language', {
      type: Sequelize.ENUM(...['ar', 'en']),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Terms_Conditions', 'language');
  },
};
