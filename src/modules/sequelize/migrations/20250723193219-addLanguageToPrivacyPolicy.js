'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Privacy_Policy', 'language', {
      type: Sequelize.ENUM(...['ar', 'en']),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Privacy_Policy', 'language');
  },
};
