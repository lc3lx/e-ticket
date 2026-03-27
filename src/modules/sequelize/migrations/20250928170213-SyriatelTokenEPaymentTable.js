'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SyriatelEPaymentToken', {
      token: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true,
      },
      expiredAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      errorCode: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      errorDesc: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      merchantMSISDN: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('SyriatelEPaymentToken', ['token'], {
      unique: true,
      name: 'syriatel_epayment_token_unique_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SyriatelEPaymentToken');
  },
};
