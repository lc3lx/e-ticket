'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RequestMessage', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      supervisorRequestId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'SupervisorRequest',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      senderRole: {
        type: Sequelize.ENUM('supervisor', 'admin'),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('RequestMessage');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_RequestMessage_senderRole";');
  },
};
