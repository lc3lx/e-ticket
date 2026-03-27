import { Transaction } from 'sequelize';

class Createticket {
  bookingId!: number;
  username!: string;
  transaction!: Transaction;
  scans!: number;
}

export default Createticket;
