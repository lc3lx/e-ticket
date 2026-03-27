'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('user_devices', ['userId', 'fcmToken'], {
      unique: true,
      name: 'user_fcm_token_unique_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('user_devices', 'user_fcm_token_unique_idx');
  },
};
