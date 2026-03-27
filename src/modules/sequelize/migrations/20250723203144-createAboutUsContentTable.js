'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('About_Us_Translation', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      aboutUsId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'About_Us',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      language: {
        type: Sequelize.ENUM('en', 'ar'),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addConstraint('About_Us_Translation', {
      fields: ['aboutUsId', 'language'],
      type: 'unique',
      name: 'unique_aboutus_language',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('About_Us_Translation');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_About_Us_Translations_language";');
  },
};
