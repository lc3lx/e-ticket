'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'ScannerUser',
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        mobileNumber: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        scannerUserPhoto: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        password: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        deactivated: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        PasswordChangeDate: {
          type: Sequelize.DATE,
          allowNull: true,
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
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      },
      {
        indexes: [{ fields: ['id'] }, { unique: true, fields: ['name'] }],
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ScannerUser');
  },
};
