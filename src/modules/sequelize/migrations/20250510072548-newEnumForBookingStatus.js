'use strict';

const enumName = 'enum_BookTicket_status';
const newValues = ['cancelled automatically', 'rejected by system admin'];

module.exports = {
  async up(queryInterface, Sequelize) {
    for (const value of newValues) {
      const [[{ exists }]] = await queryInterface.sequelize.query(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_enum
          JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
          WHERE pg_type.typname = '${enumName}' AND enumlabel = '${value}'
        ) AS exists;
      `);

      if (!exists) {
        await queryInterface.sequelize.query(`
          ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS '${value}';
        `);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    console.warn(`Skipping 'down' migration because removing enum values is not supported.`);
  },
};
