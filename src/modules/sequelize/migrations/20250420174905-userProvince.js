'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserProvince', {
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'NormalUser',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      provinceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Province',
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

    await queryInterface.addIndex('UserProvince', ['userId', 'provinceId'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserProvince');
  },
};
