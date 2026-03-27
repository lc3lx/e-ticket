'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('BookTicket', 'paymentMethodId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'EPayment', // table name in DB
        key: 'id',
      },
      onDelete: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('BookTicket', 'paymentMethodId');
  },
};
