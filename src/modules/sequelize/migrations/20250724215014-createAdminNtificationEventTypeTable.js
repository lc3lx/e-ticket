'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('NotificationAdminEventType', {
      notificationAdminId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'NotificationAdmin',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      eventTypeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'EventType',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    });

    await queryInterface.addConstraint('NotificationAdminEventType', {
      fields: ['notificationAdminId', 'eventTypeId'],
      type: 'primary key',
      name: 'pk_notificationAdmin_eventType',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('NotificationAdminEventType');
  },
};
