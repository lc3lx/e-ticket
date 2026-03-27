'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('EPayment', 'bookId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'BookTicket', key: 'id' },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('EPayment', 'bookId');
  },
};
