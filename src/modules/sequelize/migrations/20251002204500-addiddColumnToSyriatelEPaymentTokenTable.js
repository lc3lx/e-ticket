'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Drop old PK constraint on "token"
      // Postgres automatically names constraints like "<table>_pkey"
      await queryInterface.removeConstraint('SyriatelEPaymentToken', 'SyriatelEPaymentToken_pkey', { transaction });

      // 2. Add the new id column
      await queryInterface.addColumn(
        'SyriatelEPaymentToken',
        'id',
        {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        { transaction },
      );

      // 3. Add a unique constraint on token (since you probably still want uniqueness)
      await queryInterface.addConstraint('SyriatelEPaymentToken', {
        fields: ['token'],
        type: 'unique',
        name: 'unique_token_constraint',
        transaction,
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Drop the new id column
      await queryInterface.removeColumn('SyriatelEPaymentToken', 'id', { transaction });

      // Drop the unique constraint on token
      await queryInterface.removeConstraint('SyriatelEPaymentToken', 'unique_token_constraint', { transaction });

      // Restore primary key on token
      await queryInterface.addConstraint('SyriatelEPaymentToken', {
        fields: ['token'],
        type: 'primary key',
        name: 'SyriatelEPaymentToken_pkey',
        transaction,
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
