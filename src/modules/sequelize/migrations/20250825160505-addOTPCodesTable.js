'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('OtpCodes', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'NormalUser',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      userType: {
        type: Sequelize.ENUM(...Object.values(require('../../../../dist/common/enums/userTypes.enum.js').default)),
        allowNull: false,
      },
      mobileNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      codeHash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      purpose: {
        type: Sequelize.ENUM(
          'signup',
          'login',
          'spervisor_password_reset',
          'scanner_password_reset',
          'supervisor_login',
        ),
        allowNull: false,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      verifiedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      signupData: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('OtpCodes', ['mobileNumber']);
    await queryInterface.addIndex('OtpCodes', ['purpose']);
    await queryInterface.addIndex('OtpCodes', ['expiresAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('OtpCodes', ['mobileNumber']);
    await queryInterface.removeIndex('OtpCodes', ['purpose']);
    await queryInterface.removeIndex('OtpCodes', ['expiresAt']);
    await queryInterface.dropTable('OtpCodes');

    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_OtpCodes_userType";`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_OtpCodes_purpose";`);
  },
};
