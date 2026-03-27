'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Notification', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'User',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      body: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      markAsReaded: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      sendDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      userType: {
        type: Sequelize.ENUM('supervisor', 'normalUser'),
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM(
          ...Object.values(require('../../../../dist/common/enums/notificationTypes.enum.js').default),
        ),
        allowNull: false,
      },
    });

    await queryInterface.addIndex('Notification', ['id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Notification');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Notification_userType";');
  },
};
