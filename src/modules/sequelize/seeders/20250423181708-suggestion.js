'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    //     const now = new Date();
    //     await queryInterface.bulkInsert('Suggestions', [
    //       {
    //         userId: 1,
    //         eventId: 1,
    //         suggestionText: 'The event could have more interactive sessions.',
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //       {
    //         userId: 2,
    //         eventId: 2,
    //         suggestionText: 'Great event, but the food options were limited.',
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //       {
    //         userId: 3,
    //         eventId: 3,
    //         suggestionText: 'Would love to see a live performance next time.',
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //       {
    //         userId: 4,
    //         eventId: 4,
    //         suggestionText: 'Consider improving the event’s sound quality.',
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //       {
    //         userId: 5,
    //         eventId: 5,
    //         suggestionText: 'It would be great if the event timings were more flexible.',
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //     ]);
    //     await queryInterface.sequelize.query(`SELECT setval('"Suggestions_id_seq"', (SELECT MAX(id) FROM "Suggestions"));`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Suggestions', null, {});
  },
};
