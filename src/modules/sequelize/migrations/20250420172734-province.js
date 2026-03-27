'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Province', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      provinceName: {
        type: Sequelize.ENUM(...Object.values(require('../../../../dist/common/enums/provinces.enum').default)),
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Province');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Province_provinceName";');
  },
};
