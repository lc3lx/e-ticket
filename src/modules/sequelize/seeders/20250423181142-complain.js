'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    //     const now = new Date();
    //     await queryInterface.bulkInsert('Complain', [
    //       {
    //         userId: 1,
    //         eventId: 1,
    //         complainTypeId: 2, // Example: A specific complaint type (not "Other")
    //         customComplain: null,
    //         isReaded: false,
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //       {
    //         userId: 2,
    //         eventId: 2,
    //         complainTypeId: 1, // "Other" complaint type
    //         customComplain: 'The event was too noisy, and I couldn’t hear the speakers properly.',
    //         isReaded: false,
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //       {
    //         userId: 3,
    //         eventId: 3,
    //         complainTypeId: 3, // Another specific complaint type
    //         customComplain: null,
    //         isReaded: true,
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //       {
    //         userId: 4,
    //         eventId: 4,
    //         complainTypeId: 1, // "Other" complaint type
    //         customComplain: 'The event was well organized, but the seating arrangement was uncomfortable.',
    //         isReaded: false,
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //       {
    //         userId: 5,
    //         eventId: 5,
    //         complainTypeId: 4,
    //         customComplain: null,
    //         isReaded: true,
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //     ]);
    //     await queryInterface.sequelize.query(`SELECT setval('"Complain_id_seq"', (SELECT MAX(id) FROM "Complain"));`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Complain', null, {});
  },
};
