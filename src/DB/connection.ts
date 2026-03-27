import { sequelize } from './sequelize.js';

import './associations.js';

const connect = async () => {
  try {
    await sequelize.authenticate({ logging: false });
    console.log('Connection has been established successfully.');
  } catch (error: Error | unknown) {
    console.error('Unable to connect to the database:', (error as Error).name);
    throw new Error((error as Error).message, { cause: error });
  }
};

export default { connect };
