'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_OtpCodes_purpose" ADD VALUE IF NOT EXISTS 'supervisor_forget_password';
    `);
  },

  async down(queryInterface, Sequelize) {
    // ⚠️ Postgres does not support removing values from ENUM
    // To roll back, you’d need to recreate the enum type
    await queryInterface.changeColumn('OtpCodes', 'purpose', {
      type: Sequelize.ENUM(
        'signup',
        'login',
        'supervisor_password_reset',
        'supervisor_login',
        'scanner_password_reset',
      ),
      allowNull: false,
    });
  },
};
