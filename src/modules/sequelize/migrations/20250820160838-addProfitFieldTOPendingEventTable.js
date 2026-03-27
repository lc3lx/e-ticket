'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('PendingEvent', 'profit', {
      type: Sequelize.INTEGER,
      allowNull: true,
      // defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('PendingEvent', 'profit');
  },
};
