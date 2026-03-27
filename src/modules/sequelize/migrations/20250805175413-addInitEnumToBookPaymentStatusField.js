'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_BookTicket_paymentStatus" ADD VALUE IF NOT EXISTS 'init';
    `);
  },
  down: async () => {
    // Postgres doesn't support removing enum values easily, so usually this is left empty or documented.
  },
};
