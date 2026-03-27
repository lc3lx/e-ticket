'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    //     const now = new Date();
    //     await queryInterface.bulkInsert('Favorite', [
    //       { userId: 1, eventId: 1, createdAt: now, updatedAt: now },
    //       { userId: 1, eventId: 2, createdAt: now, updatedAt: now },
    //       { userId: 2, eventId: 1, createdAt: now, updatedAt: now },
    //       { userId: 2, eventId: 3, createdAt: now, updatedAt: now },
    //       { userId: 3, eventId: 2, createdAt: now, updatedAt: now },
    //       { userId: 3, eventId: 4, createdAt: now, updatedAt: now },
    //       { userId: 4, eventId: 1, createdAt: now, updatedAt: now },
    //       { userId: 4, eventId: 5, createdAt: now, updatedAt: now },
    //       { userId: 5, eventId: 3, createdAt: now, updatedAt: now },
    //       { userId: 5, eventId: 4, createdAt: now, updatedAt: now },
    //       { userId: 2, eventId: 5, createdAt: now, updatedAt: now },
    //       { userId: 3, eventId: 5, createdAt: now, updatedAt: now },
    //       { userId: 1, eventId: 3, createdAt: now, updatedAt: now },
    //     ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Favorite', null, {});
  },
};
