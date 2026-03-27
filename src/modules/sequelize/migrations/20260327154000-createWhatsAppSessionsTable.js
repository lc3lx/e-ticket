'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('WhatsAppSessions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      sessionKey: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      sessionData: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      qrCode: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      isReady: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      lastConnectedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('WhatsAppSessions');
  },
};
