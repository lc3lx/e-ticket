'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('NormalUser', {
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
        allowNull: false,
        unique: true,
      },
      profilePicture: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      gender: {
        type: Sequelize.ENUM(...Object.values(require('../../../../dist/common/enums/gender.enum.js').default)),
        allowNull: false,
      },
      birthDate: {
        type: Sequelize.DATE,
        allowNull: false,
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

    await queryInterface.addIndex('NormalUser', ['id']);
    await queryInterface.addIndex('NormalUser', ['mobileNumber'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('NormalUser');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_NormalUser_gender";');
  },
};
