'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PendingSupervisorChanges', {
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
        // unique: 'supervisorId',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'User',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      mobileNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      gender: {
        type: Sequelize.ENUM(...Object.values(require('../../../../dist/common/enums/gender.enum.js').default)),
        allowNull: true,
      },
      birthDate: {
        type: Sequelize.DATE,
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
      workInfo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      workType: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        allowNull: true,
      },
      workDocument: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isApproved: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isRejected: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      lastName: {
        type: Sequelize.STRING,
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

    await queryInterface.addIndex('PendingSupervisorChanges', ['id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PendingSupervisorChanges');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_PendingSupervisorChanges_gender";');
  },
};
