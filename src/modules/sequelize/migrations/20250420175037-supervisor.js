'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Supervisor', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
      username: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      password: {
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
      workInfo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      workDocument: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      deactivated: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      blocked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deletePending: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      PasswordChangeDate: {
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
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('Supervisor', ['id']);
    await queryInterface.addIndex('Supervisor', ['username'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Supervisor');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Supervisor_gender";');
  },
};
