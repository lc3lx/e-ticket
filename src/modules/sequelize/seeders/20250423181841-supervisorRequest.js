'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    //     const now = new Date();
    //     // Insert SupervisorRequest entries
    //     await queryInterface.bulkInsert('SupervisorRequest', [
    //       {
    //         id: 1,
    //         supervisorId: 1,
    //         requestType: 'eventCreate',
    //         requestTargetId: 1,
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //       {
    //         id: 2,
    //         supervisorId: 2,
    //         requestType: 'eventUpdate',
    //         requestTargetId: 2,
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //       {
    //         id: 3,
    //         supervisorId: 3,
    //         requestType: 'profileUpdate',
    //         requestTargetId: 3,
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //       {
    //         id: 4,
    //         supervisorId: 4,
    //         requestType: 'profileDelete',
    //         requestTargetId: 4,
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //       {
    //         id: 5,
    //         supervisorId: 5,
    //         requestType: 'eventCreate',
    //         requestTargetId: 5,
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //     ]);
    //     // Insert RequestMessage entries
    //     await queryInterface.bulkInsert('RequestMessage', [
    //       {
    //         supervisorRequestId: 1,
    //         senderRole: 'supervisor',
    //         message: 'I would like to create this new event.',
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //       {
    //         supervisorRequestId: 2,
    //         senderRole: 'admin',
    //         message: 'Event update request has been reviewed.',
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //       {
    //         supervisorRequestId: 3,
    //         senderRole: 'supervisor',
    //         message: 'Please update my profile details.',
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //       {
    //         supervisorRequestId: 4,
    //         senderRole: 'admin',
    //         message: 'Your profile deletion request is under review.',
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //       {
    //         supervisorRequestId: 5,
    //         senderRole: 'supervisor',
    //         message: 'I need this event created for our next show.',
    //         createdAt: now,
    //         updatedAt: now,
    //       },
    //     ]);
    //     await queryInterface.sequelize.query(
    //       `SELECT setval('"SupervisorRequest_id_seq"', (SELECT MAX(id) FROM "SupervisorRequest"));`,
    //     );
    //     await queryInterface.sequelize.query(
    //       `SELECT setval('"RequestMessage_id_seq"', (SELECT MAX(id) FROM "RequestMessage"));`,
    //     );
  },

  async down(queryInterface, Sequelize) {
    // Delete inserted data
    await queryInterface.bulkDelete('RequestMessage', null, {});
    await queryInterface.bulkDelete('SupervisorRequest', null, {});
  },
};
