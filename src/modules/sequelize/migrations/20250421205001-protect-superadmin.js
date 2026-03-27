'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- Drop existing triggers and function to ensure clean state
      DROP TRIGGER IF EXISTS protect_superadmin ON "User";
      DROP TRIGGER IF EXISTS protect_superadmin_dashboard ON "DashboardAdmin";
      DROP FUNCTION IF EXISTS prevent_superadmin_modification CASCADE;

      -- Create the function
      CREATE OR REPLACE FUNCTION prevent_superadmin_modification()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Check for User table
        IF TG_TABLE_NAME = 'User' THEN
          IF TG_OP = 'DELETE' THEN
            IF OLD.id = 1 THEN
              RAISE EXCEPTION 'Cannot delete superadmin (id: 1) in User';
            END IF;
            RETURN OLD; -- ✅ Allow DELETE for non-superadmin
          END IF;

          IF TG_OP = 'UPDATE' THEN
            IF OLD.id = 1 THEN
              IF OLD."firstName" IS DISTINCT FROM NEW."firstName" OR
                OLD."lastName" IS DISTINCT FROM NEW."lastName" OR
                OLD."isBlocked" IS DISTINCT FROM NEW."isBlocked" OR
                OLD."isDeleted" IS DISTINCT FROM NEW."isDeleted" OR
                --OLD.email IS DISTINCT FROM NEW.email 
                THEN
              RAISE EXCEPTION 'Cannot modify superadmin (id: 1) in User';
              END IF;
            END IF;
            RETURN NEW;
          END IF;
        END IF;

        -- Check for DashboardAdmin table
        IF TG_TABLE_NAME = 'DashboardAdmin' THEN
          IF TG_OP = 'DELETE' THEN
            IF OLD.id = 1 THEN
              RAISE EXCEPTION 'Cannot delete superadmin (id: 1) in DashboardAdmin';
            END IF;
            RETURN OLD; -- ✅ Allow DELETE for non-superadmin
          END IF;

          IF TG_OP = 'INSERT' THEN
            IF NEW.role = 'superadmin' AND NEW.id != 1 THEN
              RAISE EXCEPTION 'Cannot create new superadmin in DashboardAdmin';
            END IF;
            RETURN NEW;
          END IF;

          IF TG_OP = 'UPDATE' THEN
            IF OLD.id = 1 OR NEW.id = 1 THEN
              RAISE EXCEPTION 'Cannot modify superadmin (id: 1) in DashboardAdmin';
            END IF;
            IF NEW.role = 'superadmin' THEN
              RAISE EXCEPTION 'Cannot set role to superadmin for non-superadmin accounts';
            END IF;
            RETURN NEW;
          END IF;
        END IF;

        RETURN NEW; -- default behavior
      END;
      $$ LANGUAGE plpgsql;

      -- Create triggers for specific tables
      CREATE TRIGGER protect_superadmin
      BEFORE UPDATE OR DELETE ON "User"
      FOR EACH ROW EXECUTE FUNCTION prevent_superadmin_modification();

      CREATE TRIGGER protect_superadmin_dashboard
      BEFORE INSERT OR UPDATE OR DELETE ON "DashboardAdmin"
      FOR EACH ROW EXECUTE FUNCTION prevent_superadmin_modification();
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS protect_superadmin ON "User";
      DROP TRIGGER IF EXISTS protect_superadmin_dashboard ON "DashboardAdmin";
      DROP FUNCTION IF EXISTS prevent_superadmin_modification CASCADE;
    `);
  },
};
