'use strict';

/** @type {import('sequelize-cli').Migration} */
const USER_TYPES = ['supervisor', 'normalUser'];
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('NotificationAdmin', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      body: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sendDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      targetedUsersType: {
        type: Sequelize.ENUM(...USER_TYPES),
        allowNull: false,
      },
      gender: {
        type: Sequelize.ENUM(
          ...Object.values(...Object.values(require('../../../../dist/common/enums/gender.enum.js').default)),
        ),
        allowNull: true,
      },
      minAge: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      maxAge: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('NotificationAdmin', ['id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('NotificationAdmin');
  },
};
