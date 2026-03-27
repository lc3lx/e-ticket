'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SupervisorRequest', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      supervisorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Supervisor',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      requestType: {
        type: Sequelize.ENUM('eventCreate', 'eventUpdate', 'profileUpdate', 'profileDelete'),
        allowNull: false,
      },
      requestTargetId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SupervisorRequest');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_SupervisorRequest_requestType";');
  },
};
