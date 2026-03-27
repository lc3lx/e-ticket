'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('MTNEPayment', 'RecipientFullName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('MTNEPayment', 'RecipientPan', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('MTNEPayment', 'RecipientPhone', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('MTNEPayment', 'resendCount', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('MTNEPayment', 'RecipientFullName');
    await queryInterface.removeColumn('MTNEPayment', 'RecipientPan');
    await queryInterface.removeColumn('MTNEPayment', 'RecipientPhone');
    await queryInterface.removeColumn('MTNEPayment', 'resendCount');
  },
};
