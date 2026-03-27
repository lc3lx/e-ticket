'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('NotificationAdminProvince', {
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
      provinceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Province',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    });

    await queryInterface.addConstraint('NotificationAdminProvince', {
      fields: ['notificationAdminId', 'provinceId'],
      type: 'primary key',
      name: 'pk_notificationAdmin_province',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('NotificationAdminProvince');
  },
};
