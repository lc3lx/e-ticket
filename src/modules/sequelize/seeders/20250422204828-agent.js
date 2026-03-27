'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.bulkInsert(
    //   'Agent',
    //   [
    //     {
    //       id: 1,
    //       name: 'Ahmad Khaled',
    //       agentPhoto: 'http://207.180.217.5:5000/agents/ahmad_khaled.jpg',
    //       provinceId: 1,
    //       location: 'Al-Mazzeh, Damascus',
    //       mobileNumber: '0994508002',
    //       createdAt: new Date('2025-04-23T00:00:00Z'),
    //       updatedAt: new Date('2025-04-23T00:00:00Z'),
    //     },
    //     {
    //       id: 2,
    //       name: 'Layla Hassan',
    //       agentPhoto: 'http://207.180.217.5:5000/agents/layla_hassan.jpg',
    //       provinceId: 3,
    //       location: 'Al-Furqan, Aleppo',
    //       mobileNumber: '0994508003',
    //       createdAt: new Date('2025-04-24T00:00:00Z'),
    //       updatedAt: new Date('2025-04-24T00:00:00Z'),
    //     },
    //     {
    //       id: 3,
    //       name: 'Omar Saleh',
    //       agentPhoto: null,
    //       provinceId: 6,
    //       location: 'Al-Raml, Latakia',
    //       mobileNumber: '0994508004',
    //       createdAt: new Date('2025-04-25T00:00:00Z'),
    //       updatedAt: new Date('2025-04-25T00:00:00Z'),
    //     },
    //   ],
    //   {},
    // );
    // await queryInterface.sequelize.query(`SELECT setval('"Agent_id_seq"', (SELECT MAX(id) FROM "Agent"));`);
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.bulkDelete('Agent', null, {});
    } catch (error) {
      console.error('Error in down function:', error);
      throw error;
    }
  },
};
