'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'EPayment',
      [
        {
          id: 1,
          ServiceName: 'MTN',
          paymentMethodLogo: 'http://e-ticketsapp.com.sy:5000/paymentMethodLogo/paymentMethod-MTN-1765427824556.jpeg',
          color: 'FFCB00',
          isEnabled: true,
          mobileNumber: '963998765432',
          bankName: 'Al-Barakeh',
          bankAccount: '123456789',

          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          ServiceName: 'SYRIATEL',
          paymentMethodLogo:
            'http://e-ticketsapp.com.sy:5000/paymentMethodLogo/paymentMethod-paymentMethod-1765427868577.jpeg',
          color: 'E20000',
          isEnabled: true,
          mobileNumber: '963998765432',
          bankName: 'Al-Barakeh',
          bankAccount: '987654321',

          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );

    await queryInterface.sequelize.query(`SELECT setval('"EPayment_id_seq"', (SELECT MAX(id) FROM "EPayment"));`);
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.bulkDelete('EPayment', null, {});
    } catch (error) {
      console.error('Error in down function:', error);
      throw error;
    }
  },
};
