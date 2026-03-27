'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Event_eventStatus" ADD VALUE IF NOT EXISTS 'startingSoon';
    `);
  },

  async down(queryInterface, Sequelize) {
    // ⚠️ Postgres does not support removing values from ENUM
    // To roll back, you’d need to recreate the enum type
    console.warn('Enum value removal is not supported in PostgreSQL');
  },
};
