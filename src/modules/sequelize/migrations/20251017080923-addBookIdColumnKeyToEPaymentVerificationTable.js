'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PaymentVerification', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      serviceName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      bookId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'BookTicket', // ✅ must match your actual table name
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      // phoneNumber: {
      //   type: Sequelize.STRING,
      //   allowNull: false,
      // },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      nextAllowed: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      retries: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      minutesToWait: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      verifiedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PaymentVerification');
  },
};
