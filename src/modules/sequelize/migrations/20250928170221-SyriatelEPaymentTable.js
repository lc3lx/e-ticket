'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SyriatelEPayment', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      errorCode: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      errorDesc: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      bookId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'BookTicket',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customerMSISDN: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      transactionID: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      amount: {
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

    await queryInterface.addIndex('SyriatelEPayment', ['id'], {
      unique: true,
      name: 'syriatel_epayment_id_unique_idx',
    });

    await queryInterface.addIndex('SyriatelEPayment', ['bookId'], {
      name: 'syriatel_epayment_bookid_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SyriatelEPayment');
  },
};
