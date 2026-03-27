'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable('EPayment', 'MTNEPayment');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable('MTNEPayment', 'EPayment');
  },
};
