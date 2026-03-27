/* eslint-disable @typescript-eslint/no-require-imports */
const { join } = require('path');
const { config } = require('dotenv');

config({ path: join(__dirname, '..', '..', '..', '..', 'config.env') });

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'devdb_eticket',
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: 5432,
    ssl: { require: true, rejectUnauthorized: false },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
  test: {
    username: process.env.DB_LOCAL_USER,
    password: process.env.DB_LOCAL_PASSWORD,
    database: process.env.DB_LOCAL_NAME,
    host: process.env.DB_LOCAL_HOST,
    dialect: 'postgres',
    port: 5432,
    ssl: false,
    dialectOptions: {
      ssl: false,
    },
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: 5432,
    ssl: { require: true, rejectUnauthorized: false },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};

