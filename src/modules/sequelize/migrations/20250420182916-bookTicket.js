'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BookTicket', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      eventId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Event',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'NormalUser',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      usernames: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
      },
      ticketsCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      ticketPrice: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      ticketOption: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
          ...Object.values(require('../../../../dist/common/enums/bookTicketStatus.enum.js').default),
        ),
        allowNull: false,
        defaultValue: 'pending',
      },
      paymentStatus: {
        type: Sequelize.ENUM(
          ...Object.values(require('../../../../dist/common/enums/bookTicketPaymentStatus.enum.js').default),
        ),
        allowNull: false,
        defaultValue: 'pending',
      },
      discountCode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      totalPrice: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      isPaperCopy: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      note: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      cancelAfter: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('BookTicket', ['status']);
    await queryInterface.addIndex('BookTicket', ['paymentStatus']);
    await queryInterface.addIndex('BookTicket', ['cancelAfter']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('BookTicket');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_BookTicket_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_BookTicket_paymentStatus";');
  },
};
