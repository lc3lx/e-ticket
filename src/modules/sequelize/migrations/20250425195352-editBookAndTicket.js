'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('BookTicket', 'usernames');
    // await queryInterface.addColumn('Ticket', 'scans', {});
    // await queryInterface.removeColumn('BookTicket', 'discountCode');
    // await queryInterface.addColumn('BookTicket', 'discountCodeId', {
    //   type: Sequelize.INTEGER,
    //   references: {
    //     model: 'DiscountCode',
    //     key: 'id',
    //   },
    //   onDelete: 'CASCADE',
    //   allowNull: false,
    // });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('BookTicket', 'usernames', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    });
    // await queryInterface.removeColumn('Ticket', 'scans');
    // await queryInterface.addColumn('BookTicket', 'discountCode', {
    //   type: Sequelize.STRING(Sequelize.STRING),
    //   allowNull: true,
    // });
    // await queryInterface.removeColumn('BookTicket', 'discountCodeId');
  },
};
