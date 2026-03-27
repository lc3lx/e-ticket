'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const existingUser = await queryInterface.sequelize.query(`SELECT id FROM "User" WHERE id = 1`, {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });
    if (!existingUser.length) {
      await queryInterface.bulkInsert(
        'User',
        [
          {
            id: 1,
            firstName: 'Super',
            lastName: 'Admin',
            isDeleted: false,
            isBlocked: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        ],
        {},
      );
    }

    // await queryInterface.bulkInsert(
    //   'User',
    //   [
    //     {
    //       id: 2,
    //       firstName: 'Hazem',
    //       lastName: 'Al-Shannan',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     },
    //     {
    //       id: 3,
    //       firstName: 'Ali',
    //       lastName: 'Saifo',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     },
    //     {
    //       id: 4,
    //       firstName: 'Kosai',
    //       lastName: 'Alshiekh ali',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     },
    //     {
    //       id: 5,
    //       firstName: 'Zain',
    //       lastName: 'Harfoush',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     },
    //     {
    //       id: 6,
    //       firstName: 'Layla',
    //       lastName: 'Ahmad',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     },
    //     {
    //       id: 7,
    //       firstName: 'Alex',
    //       lastName: 'Saifo',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     },
    //   ],
    //   {},
    // );
    await queryInterface.sequelize.query(`SELECT setval('"User_id_seq"', (SELECT MAX(id) FROM "User"));`);

    const existingAdmin = await queryInterface.sequelize.query(`SELECT id FROM "DashboardAdmin" WHERE id = 1`, {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });
    if (!existingAdmin.length) {
      await queryInterface.bulkInsert(
        'DashboardAdmin',
        [
          {
            id: 1,
            userId: 1,
            email: 'superadmin@e-tickets.sy',
            role: 'superadmin',
            password: '$2b$12$ZWVTgGDlR6NpjpXq1rp53.oITP9Dyf.8Uc2B7cslARiMuaHHNu5iC',
            //SuperAdmin@123
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        {},
      );
    }

    // await queryInterface.bulkInsert(
    //   'DashboardAdmin',
    //   [
    //     {
    //       id: 2,
    //       userId: 7,
    //       email: 'alex@e-ticket.sy',
    //       role: 'ceo',
    //       password: '$2b$12$Hv30WChx2jTLcJR3EJNnuOkv18pjH1cGTShaiWttA1pGNIVzjzEBS',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     },
    //   ],
    //   {},
    // );
    await queryInterface.sequelize.query(
      `SELECT setval('"DashboardAdmin_id_seq"', (SELECT MAX(id) FROM "DashboardAdmin"));`,
    );

    // await queryInterface.bulkInsert(
    //   'NormalUser',
    //   [
    //     {
    //       id: 1,
    //       userId: 2,
    //       mobileNumber: '963994508000',
    //       profilePicture: 'http://207.180.217.5:5000/profile_pics/normalUser-hazem-1.jpg',
    //       gender: 'male',
    //       birthDate: new Date('1997-01-01'),
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     },
    //     {
    //       id: 2,
    //       userId: 3,
    //       mobileNumber: '963994508001',
    //       gender: 'male',
    //       birthDate: new Date('2000-05-15'),
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     },
    //     {
    //       id: 3,
    //       userId: 4,
    //       mobileNumber: '963994508002',
    //       gender: 'male',
    //       birthDate: new Date('2001-05-15'),
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     },
    //     {
    //       id: 4,
    //       userId: 5,
    //       mobileNumber: '963994508003',
    //       gender: 'male',
    //       birthDate: new Date('2002-03-02'),
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     },
    //     {
    //       id: 5,
    //       userId: 6,
    //       mobileNumber: '963994508004',
    //       profilePicture: 'http://207.180.217.5:5000/profile_pics/normalUser-layla-1.jpg',
    //       gender: 'female',
    //       birthDate: new Date('1985-12-11'),
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     },
    //   ],
    //   {},
    // );
    // await queryInterface.sequelize.query(`SELECT setval('"NormalUser_id_seq"', (SELECT MAX(id) FROM "NormalUser"));`);

    // await queryInterface.bulkInsert(
    //   'UserEventType',
    //   [
    //     { userId: 1, eventTypeId: 1, createdAt: new Date(), updatedAt: new Date() },
    //     { userId: 1, eventTypeId: 2, createdAt: new Date(), updatedAt: new Date() },
    //     { userId: 2, eventTypeId: 3, createdAt: new Date(), updatedAt: new Date() },
    //     { userId: 3, eventTypeId: 1, createdAt: new Date(), updatedAt: new Date() },
    //     { userId: 3, eventTypeId: 2, createdAt: new Date(), updatedAt: new Date() },
    //     { userId: 3, eventTypeId: 3, createdAt: new Date(), updatedAt: new Date() },
    //     { userId: 3, eventTypeId: 4, createdAt: new Date(), updatedAt: new Date() },
    //     { userId: 4, eventTypeId: 2, createdAt: new Date(), updatedAt: new Date() },
    //     { userId: 5, eventTypeId: 3, createdAt: new Date(), updatedAt: new Date() },
    //     { userId: 5, eventTypeId: 1, createdAt: new Date(), updatedAt: new Date() },
    //   ],
    //   {},
    // );

    // await queryInterface.bulkInsert(
    //   'UserProvince',
    //   [
    //     { userId: 1, provinceId: 1, createdAt: new Date(), updatedAt: new Date() },
    //     { userId: 2, provinceId: 3, createdAt: new Date(), updatedAt: new Date() },
    //     { userId: 3, provinceId: 1, createdAt: new Date(), updatedAt: new Date() },
    //     { userId: 4, provinceId: 3, createdAt: new Date(), updatedAt: new Date() },
    //     { userId: 5, provinceId: 6, createdAt: new Date(), updatedAt: new Date() },
    //   ],
    //   {},
    // );
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.bulkDelete('UserProvince', null, {});
      await queryInterface.bulkDelete('UserEventType', null, {});
      await queryInterface.bulkDelete('NormalUser', null, {});
      await queryInterface.bulkDelete('DashboardAdmin', { id: { [Sequelize.Op.ne]: 1 } }, { paranoid: false });
      await queryInterface.bulkDelete('User', { id: { [Sequelize.Op.ne]: 1 } }, { paranoid: false });
    } catch (error) {
      console.error('Error in down function:', error);
      throw error;
    }
  },
};
