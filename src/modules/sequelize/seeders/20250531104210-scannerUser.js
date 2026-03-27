'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    //     await queryInterface.bulkInsert(
    //       'ScannerUser',
    //       [
    //         {
    //           id: 1,
    //           name: 'mohammed-supa-85150-scan',
    //           scannerUserPhoto: 'http://207.180.217.5:5000/workDocument/scannerUserPhoto/mohammed-supa-85150-scan.jpg',
    //           password: '$2b$12$Hv30WChx2jTLcJR3EJNnuOkv18pjH1cGTShaiWttA1pGNIVzjzEBS',
    //           supervisorId: 1,
    //           deactivated: false,
    //           PasswordChangeDate: new Date(),
    //           createdAt: new Date(),
    //           updatedAt: new Date(),
    //         },
    //         {
    //           id: 2,
    //           name: 'lina-sup-12345-scan',
    //           // scannerUserPhoto: null,
    //           password: '$2b$12$Hv30WChx2jTLcJR3EJNnuOkv18pjH1cGTShaiWttA1pGNIVzjzEBS',
    //           supervisorId: 2,
    //           deactivated: false,
    //           PasswordChangeDate: null,
    //           createdAt: new Date(),
    //           updatedAt: new Date(),
    //         },
    //         {
    //           id: 3,
    //           name: 'omar-sup-12345-scan',
    //           // scannerUserPhoto: '/photos/hassan_scan1.jpg',
    //           password: '$2b$12$Hv30WChx2jTLcJR3EJNnuOkv18pjH1cGTShaiWttA1pGNIVzjzEBS',
    //           supervisorId: 3,
    //           deactivated: false,
    //           PasswordChangeDate: new Date(),
    //           createdAt: new Date(),
    //           updatedAt: new Date(),
    //         },
    //         {
    //           id: 4,
    //           name: 'supervisor-female-12345-scan',
    //           // scannerUserPhoto: null,
    //           password: '$2b$12$Hv30WChx2jTLcJR3EJNnuOkv18pjH1cGTShaiWttA1pGNIVzjzEBS',
    //           supervisorId: 4,
    //           deactivated: true,
    //           PasswordChangeDate: null,
    //           createdAt: new Date(),
    //           updatedAt: new Date(),
    //         },
    //         {
    //           id: 5,
    //           name: 'supervisor-account-12345-scan',
    //           // scannerUserPhoto: '/photos/khaled_scan1.jpg',
    //           password: '$2b$12$Hv30WChx2jTLcJR3EJNnuOkv18pjH1cGTShaiWttA1pGNIVzjzEBS',
    //           supervisorId: 5,
    //           deactivated: false,
    //           PasswordChangeDate: new Date(),
    //           createdAt: new Date(),
    //           updatedAt: new Date(),
    //         },
    //       ],
    //       {},
    //     );
    //     await queryInterface.sequelize.query(`SELECT setval('"ScannerUser_id_seq"', (SELECT MAX(id) FROM "ScannerUser"));`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ScannerUser', null, {});
  },
};
