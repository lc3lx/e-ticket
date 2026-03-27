'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // === Event table ===
    // startEventDate
    await queryInterface.addColumn('Event', 'startEventDate_tmp', { type: Sequelize.DATEONLY });
    await queryInterface.sequelize.query(
      `UPDATE "Event" SET "startEventDate_tmp" = ("startEventDate"::timestamptz AT TIME ZONE 'UTC')::date`,
    );
    await queryInterface.removeColumn('Event', 'startEventDate');
    await queryInterface.renameColumn('Event', 'startEventDate_tmp', 'startEventDate');

    // endEventDate
    await queryInterface.addColumn('Event', 'endEventDate_tmp', { type: Sequelize.DATEONLY });
    await queryInterface.sequelize.query(
      `UPDATE "Event" SET "endEventDate_tmp" = ("endEventDate"::timestamptz AT TIME ZONE 'UTC')::date`,
    );
    await queryInterface.removeColumn('Event', 'endEventDate');
    await queryInterface.renameColumn('Event', 'endEventDate_tmp', 'endEventDate');

    // startApplyDate
    await queryInterface.addColumn('Event', 'startApplyDate_tmp', { type: Sequelize.DATEONLY });
    await queryInterface.sequelize.query(
      `UPDATE "Event" SET "startApplyDate_tmp" = ("startApplyDate"::timestamptz AT TIME ZONE 'UTC')::date`,
    );
    await queryInterface.removeColumn('Event', 'startApplyDate');
    await queryInterface.renameColumn('Event', 'startApplyDate_tmp', 'startApplyDate');

    // endApplyDate
    await queryInterface.addColumn('Event', 'endApplyDate_tmp', { type: Sequelize.DATEONLY });
    await queryInterface.sequelize.query(
      `UPDATE "Event" SET "endApplyDate_tmp" = ("endApplyDate"::timestamptz AT TIME ZONE 'UTC')::date`,
    );
    await queryInterface.removeColumn('Event', 'endApplyDate');
    await queryInterface.renameColumn('Event', 'endApplyDate_tmp', 'endApplyDate');

    // === PendingEvent table ===
    // startEventDate
    await queryInterface.addColumn('PendingEvent', 'startEventDate_tmp', { type: Sequelize.DATEONLY });
    await queryInterface.sequelize.query(
      `UPDATE "PendingEvent" SET "startEventDate_tmp" = ("startEventDate"::timestamptz AT TIME ZONE 'UTC')::date`,
    );
    await queryInterface.removeColumn('PendingEvent', 'startEventDate');
    await queryInterface.renameColumn('PendingEvent', 'startEventDate_tmp', 'startEventDate');

    // endEventDate
    await queryInterface.addColumn('PendingEvent', 'endEventDate_tmp', { type: Sequelize.DATEONLY });
    await queryInterface.sequelize.query(
      `UPDATE "PendingEvent" SET "endEventDate_tmp" = ("endEventDate"::timestamptz AT TIME ZONE 'UTC')::date`,
    );
    await queryInterface.removeColumn('PendingEvent', 'endEventDate');
    await queryInterface.renameColumn('PendingEvent', 'endEventDate_tmp', 'endEventDate');

    // startApplyDate
    await queryInterface.addColumn('PendingEvent', 'startApplyDate_tmp', { type: Sequelize.DATEONLY });
    await queryInterface.sequelize.query(
      `UPDATE "PendingEvent" SET "startApplyDate_tmp" = ("startApplyDate"::timestamptz AT TIME ZONE 'UTC')::date`,
    );
    await queryInterface.removeColumn('PendingEvent', 'startApplyDate');
    await queryInterface.renameColumn('PendingEvent', 'startApplyDate_tmp', 'startApplyDate');

    // endApplyDate
    await queryInterface.addColumn('PendingEvent', 'endApplyDate_tmp', { type: Sequelize.DATEONLY });
    await queryInterface.sequelize.query(
      `UPDATE "PendingEvent" SET "endApplyDate_tmp" = ("endApplyDate"::timestamptz AT TIME ZONE 'UTC')::date`,
    );
    await queryInterface.removeColumn('PendingEvent', 'endApplyDate');
    await queryInterface.renameColumn('PendingEvent', 'endApplyDate_tmp', 'endApplyDate');
  },

  down: async (queryInterface, Sequelize) => {
    // === Event table ===
    await queryInterface.addColumn('Event', 'startEventDate_tmp', { type: Sequelize.DATE });
    await queryInterface.sequelize.query(
      `UPDATE "Event" SET "startEventDate_tmp" = ("startEventDate"::date || ' 00:00:00')::timestamp`,
    );
    await queryInterface.removeColumn('Event', 'startEventDate');
    await queryInterface.renameColumn('Event', 'startEventDate_tmp', 'startEventDate');

    await queryInterface.addColumn('Event', 'endEventDate_tmp', { type: Sequelize.DATE });
    await queryInterface.sequelize.query(
      `UPDATE "Event" SET "endEventDate_tmp" = ("endEventDate"::date || ' 00:00:00')::timestamp`,
    );
    await queryInterface.removeColumn('Event', 'endEventDate');
    await queryInterface.renameColumn('Event', 'endEventDate_tmp', 'endEventDate');

    await queryInterface.addColumn('Event', 'startApplyDate_tmp', { type: Sequelize.DATE });
    await queryInterface.sequelize.query(
      `UPDATE "Event" SET "startApplyDate_tmp" = ("startApplyDate"::date || ' 00:00:00')::timestamp`,
    );
    await queryInterface.removeColumn('Event', 'startApplyDate');
    await queryInterface.renameColumn('Event', 'startApplyDate_tmp', 'startApplyDate');

    await queryInterface.addColumn('Event', 'endApplyDate_tmp', { type: Sequelize.DATE });
    await queryInterface.sequelize.query(
      `UPDATE "Event" SET "endApplyDate_tmp" = ("endApplyDate"::date || ' 00:00:00')::timestamp`,
    );
    await queryInterface.removeColumn('Event', 'endApplyDate');
    await queryInterface.renameColumn('Event', 'endApplyDate_tmp', 'endApplyDate');

    // === PendingEvent table ===
    await queryInterface.addColumn('PendingEvent', 'startEventDate_tmp', { type: Sequelize.DATE });
    await queryInterface.sequelize.query(
      `UPDATE "PendingEvent" SET "startEventDate_tmp" = ("startEventDate"::date || ' 00:00:00')::timestamp`,
    );
    await queryInterface.removeColumn('PendingEvent', 'startEventDate');
    await queryInterface.renameColumn('PendingEvent', 'startEventDate_tmp', 'startEventDate');

    await queryInterface.addColumn('PendingEvent', 'endEventDate_tmp', { type: Sequelize.DATE });
    await queryInterface.sequelize.query(
      `UPDATE "PendingEvent" SET "endEventDate_tmp" = ("endEventDate"::date || ' 00:00:00')::timestamp`,
    );
    await queryInterface.removeColumn('PendingEvent', 'endEventDate');
    await queryInterface.renameColumn('PendingEvent', 'endEventDate_tmp', 'endEventDate');

    await queryInterface.addColumn('PendingEvent', 'startApplyDate_tmp', { type: Sequelize.DATE });
    await queryInterface.sequelize.query(
      `UPDATE "PendingEvent" SET "startApplyDate_tmp" = ("startApplyDate"::date || ' 00:00:00')::timestamp`,
    );
    await queryInterface.removeColumn('PendingEvent', 'startApplyDate');
    await queryInterface.renameColumn('PendingEvent', 'startApplyDate_tmp', 'startApplyDate');

    await queryInterface.addColumn('PendingEvent', 'endApplyDate_tmp', { type: Sequelize.DATE });
    await queryInterface.sequelize.query(
      `UPDATE "PendingEvent" SET "endApplyDate_tmp" = ("endApplyDate"::date || ' 00:00:00')::timestamp`,
    );
    await queryInterface.removeColumn('PendingEvent', 'endApplyDate');
    await queryInterface.renameColumn('PendingEvent', 'endApplyDate_tmp', 'endApplyDate');
  },
};
