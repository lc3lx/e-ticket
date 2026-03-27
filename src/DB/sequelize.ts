import path from 'path';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { development, test, production } from '../modules/sequelize/config/config.js';

dotenv.config({ path: path.join(__dirname, '..', '..', 'config.env') });

const env = process.env.NODE_ENV || 'development';
const dbConfig = { development, test, production }[env];

const sequelize = new Sequelize(
  dbConfig!.database as string,
  dbConfig!.username as string,
  dbConfig!.password as string,

  {
    host: dbConfig!.host,
    dialect: dbConfig!.dialect as 'postgres',
    port: dbConfig!.port || parseInt(process.env.DB_PORT as string, 10),
    ssl: process.env.NODE_ENV !== 'test',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'test' ? false : { rejectUnauthorized: false },
      useUTC: false,
    },
    // timezone: 'local',
    // timezone: '+03:00',
    logging: false,
    define: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
    pool: { max: 20, min: 0, acquire: 30000, idle: 10000 },
  },
);

export { sequelize };
