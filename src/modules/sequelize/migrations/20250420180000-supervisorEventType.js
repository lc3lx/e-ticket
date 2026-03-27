'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SupervisorEventType', {
      supervisorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Supervisor',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      eventTypeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'EventType',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('SupervisorEventType', ['supervisorId', 'eventTypeId'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SupervisorEventType');
  },
};
