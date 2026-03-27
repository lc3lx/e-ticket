'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Complain', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
      eventId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Event',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      complainTypeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'ComplaintType',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      customComplain: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isReaded: {
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
    });

    await queryInterface.addIndex('Complain', ['userId', 'eventId'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Complain');
  },
};
