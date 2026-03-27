'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    //     const now = new Date();
    //     await queryInterface.bulkInsert('Terms_Conditions', [
    //       {
    //         language: 'en',
    //         content: `By using our platform, you agree to abide by our community guidelines and respect the rights of other users.
    // All data submitted must be accurate and lawful. Misuse or fraudulent activity may result in account suspension.`,
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //       {
    //         language: 'ar',
    //         content: `الشروط والأحكام العربية.`,
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //     ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Terms_Conditions', null, {});
  },
};
