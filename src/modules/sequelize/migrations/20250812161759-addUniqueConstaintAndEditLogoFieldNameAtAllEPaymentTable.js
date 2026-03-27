'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1- Rename column 'logo' to 'paymentMethodLogo'
    await queryInterface.renameColumn('EPayment', 'logo', 'paymentMethodLogo');

    // 2- Add unique constraint to 'ServiceName'
    await queryInterface.changeColumn('EPayment', 'ServiceName', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert unique constraint
    await queryInterface.changeColumn('EPayment', 'ServiceName', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: false,
    });

    // Rename column back
    await queryInterface.renameColumn('EPayment', 'paymentMethodLogo', 'logo');
  },
};
