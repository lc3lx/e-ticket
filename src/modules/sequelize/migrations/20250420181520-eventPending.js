'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PendingEvent', {
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
        allowNull: true,
      },
      mainPhoto: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      miniPoster: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      eventPhotos: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      eventType: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'EventType',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      startEventDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      endEventDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      startApplyDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      endApplyDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      startEventHour: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      endEventHour: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      province: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Province',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ticketOptionsAndPrices: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      attendanceType: {
        type: Sequelize.ENUM(...Object.values(require('../../../../dist/common/enums/AttendanceType.enum.js').default)),
        allowNull: true,
      },
      seatsQty: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      eventStatus: {
        type: Sequelize.ENUM(...Object.values(require('../../../../dist/common/enums/eventStatus.enum.js').default)),
        allowNull: true,
      },
      needApproveFromSupervisor: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      visitCount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      isUpdateApproved: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      isUpdateDeclined: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
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

    await queryInterface.addIndex('PendingEvent', ['eventName']);
    await queryInterface.addIndex('PendingEvent', ['isUpdateApproved']);
    await queryInterface.addIndex('PendingEvent', ['isUpdateDeclined']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PendingEvent');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_PendingEvent_attendanceType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_PendingEvent_eventStatus";');
  },
};
