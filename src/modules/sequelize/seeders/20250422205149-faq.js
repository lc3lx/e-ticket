'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.bulkInsert(
    //   'FAQ',
    //   [
    //     {
    //       id: 1,
    //       question: 'How do I purchase a ticket on E-Tickets?',
    //       answer:
    //         'To purchase a ticket, register on our platform, browse events, select your desired event, choose your ticket type, and complete the payment process securely.',
    //       order: 1,
    //       createdAt: new Date('2025-04-23T00:00:00Z'),
    //       updatedAt: new Date('2025-04-23T00:00:00Z'),
    //     },
    //     {
    //       id: 2,
    //       question: 'Can I get a refund for my ticket?',
    //       answer:
    //         'Refunds depend on the event organizer’s policy. Check the event details or contact our support team at support@e-ticket.sy for assistance.',
    //       order: 2,
    //       createdAt: new Date('2025-04-24T00:00:00Z'),
    //       updatedAt: new Date('2025-04-24T00:00:00Z'),
    //     },
    //     {
    //       id: 3,
    //       question: 'How do I contact customer support?',
    //       answer:
    //         'You can reach our support team via email at support@e-ticket.sy or call our call center at 0994508000, available 24/7.',
    //       order: 3,
    //       createdAt: new Date('2025-04-25T00:00:00Z'),
    //       updatedAt: new Date('2025-04-25T00:00:00Z'),
    //     },
    //   ],
    //   {},
    // );
    // await queryInterface.sequelize.query(`SELECT setval('"FAQ_id_seq"', (SELECT MAX(id) FROM "FAQ"));`);
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.bulkDelete('FAQ', null, {});
    } catch (error) {
      console.error('Error in down function:', error);
      throw error;
    }
  },
};
