'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First check if the column exists
    const tableDescription = await queryInterface.describeTable('Agent');

    if (tableDescription.province) {
      // Rename the column
      await queryInterface.renameColumn('Agent', 'province', 'provinceId');

      // Add foreign key constraint if it doesn't exist
    }
  },

  async down(queryInterface, Sequelize) {
    // Check if the column exists
    const tableDescription = await queryInterface.describeTable('Agent');

    if (tableDescription.provinceId) {
      // Remove foreign key constraint first
      await queryInterface.removeConstraint('Agent', 'fk_agent_province');

      // Rename back to original
      await queryInterface.renameColumn('Agent', 'provinceId', 'province');
    }
  },
};

