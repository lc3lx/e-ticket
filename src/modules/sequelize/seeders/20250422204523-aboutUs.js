'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.bulkInsert(
    //   'About_Us',
    //   [
    //     {
    //       id: 1,
    //       callCenterMobileNumber: '0994508111',
    //       callCenterTelePhoneLineNumber: '0115358798',
    //       email: 'info@e-ticket.sy',
    //       website: 'http://www.e-ticket.sy',
    //       createdAt: new Date('2025-04-23T00:00:00Z'),
    //       updatedAt: new Date('2025-04-23T00:00:00Z'),
    //     },
    //   ],
    //   {},
    // );
    // await queryInterface.bulkInsert('About_Us_Translation', [
    //   {
    //     id: 1,
    //     language: 'en',
    //     aboutUsId: 1,
    //     content: `
    //       **About E-Tickets**
    //       Welcome to E-Tickets, Syria's premier online ticketing platform. Launched in 2025, we connect you to the best events, from concerts to cultural festivals. Our mission is to make event access seamless and secure.
    //       **Our Story**
    //       Founded by a team of tech enthusiasts, E-Tickets aims to revolutionize ticketing with user-friendly technology.
    //       **Our Values**
    //       - **Accessibility**: Events for everyone, everywhere.
    //       - **Security**: Safe transactions with encrypted payments.
    //       - **Community**: Supporting local organizers and artists.
    //       Join us in celebrating Syria’s vibrant event scene!
    //     `,
    //     createdAt: new Date('2025-04-23T00:00:00Z'),
    //     updatedAt: new Date('2025-04-23T00:00:00Z'),
    //   },
    //   {
    //     id: 2,
    //     aboutUsId: 1,
    //     language: 'ar',
    //     content: `
    //       من نحن يالعربية!!
    //     `,
    //     createdAt: new Date('2025-04-23T00:00:00Z'),
    //     updatedAt: new Date('2025-04-23T00:00:00Z'),
    //   },
    // ]);
    // await queryInterface.sequelize.query(`SELECT setval('"About_Us_id_seq"', (SELECT MAX(id) FROM "About_Us"));`);
    // await queryInterface.sequelize.query(
    //   `SELECT setval('"About_Us_Translation_id_seq"', (SELECT MAX(id) FROM "About_Us_Translation"));`,
    // );
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.bulkDelete('About_Us', null, {});
    } catch (error) {
      console.error('Error in down function:', error);
      throw error;
    }
  },
};
