'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('MTNEPayment', 'EPaymentId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'EPayment', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('MTNEPayment', 'EPaymentId');
  },
};
