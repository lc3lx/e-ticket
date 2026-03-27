'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Favorite', {
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
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('Favorite', ['userId', 'eventId'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Favorite');
  },
};
