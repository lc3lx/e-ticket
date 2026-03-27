'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('About_Us', 'callCenterTelePhoneLineNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('About_Us', 'website', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.renameColumn('About_Us', 'callCenterNumber', 'callCenterMobileNumber');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('About_Us', 'callCenterTelePhoneLineNumber');
    await queryInterface.removeColumn('About_Us', 'website');
    await queryInterface.renameColumn('About_Us', 'callCenterMobileNumber', 'callCenterNumber');
  },
};
