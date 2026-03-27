import { Server } from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import connection from './DB/connection.js';
import './DB/associations.js';

process.on('uncaughtException', (err: Error) => {
  console.log('Uncaugh Exception, Shutting down...');
  console.log(err.name, err.message);
  console.log(err);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const port = process.env.port || 5000;

const startServer = async () => {
  try {
    await connection.connect();
    // await connection.synchronizeDatabase();

    const server: Server = app.listen(port, () => console.log('🚀 Server is running on Port', port));

    process.on('unhandledRejection', (err: Error) => {
      console.log('Unhandled Rejection, Shutting down...');
      console.log(err);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
