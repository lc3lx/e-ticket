'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('EPayment', 'mobileNumber', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('EPayment', 'bankName', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('EPayment', 'bankAccount', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('EPayment', 'mobileNumber');
    await queryInterface.removeColumn('EPayment', 'bankName');
    await queryInterface.removeColumn('EPayment', 'bankAccount');
  },
};
