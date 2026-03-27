'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Event', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      supervisorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Supervisor',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      eventName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      mainPhoto: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      miniPoster: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      eventPhotos: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      eventType: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'EventType',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      startEventDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endEventDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      startApplyDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endApplyDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      startEventHour: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      endEventHour: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      province: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Province',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ticketOptionsAndPrices: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      attendanceType: {
        type: Sequelize.ENUM(...Object.values(require('../../../../dist/common/enums/AttendanceType.enum.js').default)),
        allowNull: false,
        defaultValue: 'any',
      },
      seatsQty: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      availableTickets: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      description: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      eventStatus: {
        type: Sequelize.ENUM(...Object.values(require('../../../../dist/common/enums/eventStatus.enum.js').default)),
        allowNull: false,
        defaultValue: 'commingSoon',
      },
      needApproveFromSupervisor: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      visitCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isApproved: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isDeclined: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isVisible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('Event', ['eventName']);
    await queryInterface.addIndex('Event', ['isDeclined']);
    await queryInterface.addIndex('Event', ['isApproved']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Event');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Event_attendanceType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Event_eventStatus";');
  },
};
