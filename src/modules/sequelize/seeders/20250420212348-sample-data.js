'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.bulkInsert(
    //   'EventType',
    //   [
    //     {
    //       id: 1,
    //       typeName: 'StandUp Comedy',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     },
    //     {
    //       id: 2,
    //       typeName: 'Cinema',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     },
    //     {
    //       id: 3,
    //       typeName: 'Opera',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     },
    //     {
    //       id: 4,
    //       typeName: 'Beach Party',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     },
    //   ],
    //   {},
    // );
    // await queryInterface.sequelize.query(`SELECT setval('"EventType_id_seq"', (SELECT MAX(id) FROM "EventType"));`);

    // await queryInterface.bulkInsert(
    //   'ComplaintType',
    //   [
    //     {
    //       id: 1,
    //       complaintName: 'Other',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     },
    //     {
    //       id: 2,
    //       complaintName: 'Complain 1',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     },
    //     {
    //       id: 3,
    //       complaintName: 'Complain 2',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     },
    //     {
    //       id: 4,
    //       complaintName: 'Complain 3',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     },
    //   ],
    //   {},
    // );
    // await queryInterface.sequelize.query(
    //   `SELECT setval('"ComplaintType_id_seq"', (SELECT MAX(id) FROM "ComplaintType"));`,
    // );

    await queryInterface.bulkInsert(
      'Province',
      [
        { id: 1, provinceName: 'damascus' },
        { id: 2, provinceName: 'ruraldamascus' },
        { id: 3, provinceName: 'latakia' },
        { id: 4, provinceName: 'tartus' },
        { id: 5, provinceName: 'allepo' },
        { id: 6, provinceName: 'homs' },
        { id: 7, provinceName: 'hama' },
        { id: 8, provinceName: 'dara' },
        { id: 9, provinceName: 'quneitra' },
        { id: 10, provinceName: 'assuwayda' },
        { id: 11, provinceName: 'raqqa' },
        { id: 12, provinceName: 'alhasakah' },
        { id: 13, provinceName: 'idlib' },
        { id: 14, provinceName: 'dierezzor' },
      ],
      {},
    );
    await queryInterface.sequelize.query(`SELECT setval('"Province_id_seq"', (SELECT MAX(id) FROM "Province"));`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Province', null, {});
    await queryInterface.bulkDelete('ComplaintType', null, {});
    await queryInterface.bulkDelete('EventType', null, {});
  },
};
