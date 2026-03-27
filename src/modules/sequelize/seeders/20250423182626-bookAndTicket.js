'use strict';

// const BookTicketStatus = {
//   PENDING: 'pending',
//   APPROVED: 'approved',
//   REJECTED: 'rejected',
//   CANCELED: 'canceled',
// };

// const BookTicketPaymentStatus = {
//   PENDING: 'pending',
//   COMPLETED: 'completed',
//   FAILED: 'failed',
// };

module.exports = {
  async up(queryInterface, Sequelize) {
    //     const now = new Date();
    //     // 1. Insert BookTickets (1 pending/unpaid, 1 approved/paid)
    //     await queryInterface.bulkInsert('BookTicket', [
    //       {
    //         eventId: 1,
    //         userId: 1,
    //         // usernames: ['John Doe', 'Ali أحمد'], // <-- Proper JS array
    //         ticketsCount: 2,
    //         ticketPrice: 100,
    //         ticketOption: 'classic',
    //         status: BookTicketStatus.PENDING,
    //         paymentStatus: BookTicketPaymentStatus.PENDING,
    //         totalPrice: 200,
    //         isPaperCopy: false,
    //         note: 'First test booking',
    //         cancelAfter: null,
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //       {
    //         eventId: 1,
    //         userId: 2,
    //         // usernames: ['Sara عائشة'],
    //         ticketsCount: 1,
    //         ticketPrice: 150,
    //         ticketOption: 'vip',
    //         status: BookTicketStatus.APPROVED,
    //         paymentStatus: BookTicketPaymentStatus.COMPLETED,
    //         discountCode: 'DISC20',
    //         totalPrice: 120,
    //         isPaperCopy: true,
    //         note: 'Paid VIP with discount',
    //         cancelAfter: null,
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //     ]);
    //     // 2. Get booking ID of the paid entry
    //     const [results] = await queryInterface.sequelize.query(`
    //       SELECT id FROM "BookTicket"
    //       WHERE "paymentStatus" = 'completed'
    //       ORDER BY id DESC
    //       LIMIT 1
    //     `);
    //     const paidBookingId = results[0]?.id;
    //     // 3. Insert ticket(s) for the paid booking
    //     if (paidBookingId) {
    //       await queryInterface.bulkInsert('Ticket', [
    //         {
    //           bookingId: paidBookingId,
    //           serialNumber: 'TKT-100001',
    //           username: 'Sara عائشة',
    //           isValid: true,
    //           isSuspended: false,
    //           scans: 1,
    //           createdAt: now,
    //           updatedAt: now,
    //         },
    //       ]);
    //     }
    //     await queryInterface.sequelize.query(`SELECT setval('"BookTicket_id_seq"', (SELECT MAX(id) FROM "BookTicket"));`);
    //     await queryInterface.sequelize.query(`SELECT setval('"Ticket_id_seq"', (SELECT MAX(id) FROM "Ticket"));`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Ticket', null, {});
    await queryInterface.bulkDelete('BookTicket', null, {});
  },
};
