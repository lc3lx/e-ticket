'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('PendingSupervisorChanges', 'PendingSupervisorChanges_supervisorId_fkey');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('PendingSupervisorChanges', {
      fields: ['supervisorId'],
      type: 'unique',
      name: 'supervisorId',
    });
  },
};
