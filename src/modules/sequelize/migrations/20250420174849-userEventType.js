'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserEventType', {
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'NormalUser',
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
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('UserEventType', ['userId', 'eventTypeId'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserEventType');
  },
};
