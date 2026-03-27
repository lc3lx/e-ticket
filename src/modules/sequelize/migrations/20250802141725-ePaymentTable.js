'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('EPayment', {
      Invoice: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      gatewayType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      Session: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      TTL: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      Amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      Phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      Guid: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      OperationNumber: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      Created: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      Expired: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      Processed: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      Commission: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      Tax: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      Qr: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      Currency: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      Paid: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      Status: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      Code: {
        type: Sequelize.STRING,
        allowNull: true,
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

    await queryInterface.addIndex('EPayment', ['Invoice'], {
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('EPayment');
  },
};
