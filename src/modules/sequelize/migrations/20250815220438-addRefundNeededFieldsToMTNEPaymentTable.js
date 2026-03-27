'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('MTNEPayment', 'BaseInvoice', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('MTNEPayment', 'RefundInvoice', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('MTNEPayment', 'RefundInvoiceDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('MTNEPayment', 'RefundAmount', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('MTNEPayment', 'RefundCommission', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('MTNEPayment', 'TaxSender', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('MTNEPayment', 'isRefunded', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('MTNEPayment', 'BaseInvoice');
    await queryInterface.removeColumn('MTNEPayment', 'RefundInvoice');
    await queryInterface.removeColumn('MTNEPayment', 'RefundInvoiceDate');
    await queryInterface.removeColumn('MTNEPayment', 'RefundAmount');
    await queryInterface.removeColumn('MTNEPayment', 'RefundCommission');
    await queryInterface.removeColumn('MTNEPayment', 'TaxSender');
    await queryInterface.removeColumn('MTNEPayment', 'isRefunded');
  },
};
