'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('About_Us', 'content');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('About_Us', 'content', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '',
    });
  },
};
