import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../DB/sequelize.js';
// import { errorMessage } from '../modules/i18next.config.js';

interface MTNEPaymentAttributes {
  Invoice: number;
  //   id: number;
  gatewayType: string;
  Session?: number;
  TTL: number;
  Amount: number;
  Phone?: string;
  Guid?: string;
  OperationNumber?: number;
  Created?: number;
  Expired?: number;
  Processed?: number;
  Commission?: number;
  Tax?: number;
  Qr?: string;
  Currency?: number;
  Paid?: boolean;
  Status?: number;
  Code?: string;
  Transaction?: string;
  bookId: number;
  EPaymentId: number;
  BaseInvoice?: number;
  RefundInvoice?: number;
  RefundInvoiceDate?: Date;
  RefundAmount?: number;
  RefundCommission?: number;
  TaxSender?: number;
  isRefunded?: boolean;
  RecipientFullName?: string;
  RecipientPan?: string;
  RecipientPhone?: string;
  resendCount?: number;
}

interface MTNEPaymentCreationAttributes extends Optional<MTNEPaymentAttributes, 'Invoice'> {}

// type EPaymentCreationAttributes = Partial<EPaymentAttributes>;

class MTNEPayment extends Model<MTNEPaymentAttributes, MTNEPaymentCreationAttributes> implements MTNEPaymentAttributes {
  declare Invoice: number;
  //   declare id: number;
  declare gatewayType: string; //MTN - Syriatel - Bank - etc..
  declare Session?: number;
  declare TTL: number;
  declare Amount: number;
  declare Phone?: string;
  declare Guid?: string;
  declare OperationNumber?: number;
  declare Created?: number;
  declare Expired?: number;
  declare Processed?: number;
  declare Commission?: number;
  declare Tax?: number;
  declare Qr?: string;
  declare Currency?: number;
  declare Paid?: boolean;
  declare Status?: number;
  declare Code?: string;
  declare Transaction?: string;
  declare bookId: number;
  declare EPaymentId: number;
  declare BaseInvoice?: number;
  declare RefundInvoice?: number;
  declare RefundInvoiceDate?: Date;
  declare RefundAmount?: number;
  declare RefundCommission?: number;
  declare TaxSender?: number;
  declare isRefunded?: boolean;
  declare RecipientFullName?: string;
  declare RecipientPan?: string;
  declare RecipientPhone?: string;
  declare resendCount?: number;
}

MTNEPayment.init(
  {
    Invoice: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gatewayType: { type: DataTypes.STRING, allowNull: false },
    Session: { type: DataTypes.INTEGER, allowNull: true },
    TTL: { type: DataTypes.INTEGER, allowNull: false },
    Amount: { type: DataTypes.INTEGER, allowNull: false },
    Phone: { type: DataTypes.STRING, allowNull: true },
    Guid: { type: DataTypes.STRING, allowNull: true },
    OperationNumber: { type: DataTypes.BIGINT, allowNull: true },
    Created: { type: DataTypes.INTEGER, allowNull: true },
    Expired: { type: DataTypes.INTEGER, allowNull: true },
    Processed: { type: DataTypes.DATE, allowNull: true },
    Commission: { type: DataTypes.INTEGER, allowNull: true },
    Tax: { type: DataTypes.INTEGER, allowNull: true },
    Qr: { type: DataTypes.STRING, allowNull: true },
    Currency: { type: DataTypes.INTEGER, allowNull: true },
    Paid: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    Status: { type: DataTypes.INTEGER, allowNull: true, validate: { isIn: [[0, 1, 5, 8, 9]] } },
    Code: { type: DataTypes.STRING, allowNull: true },
    Transaction: { type: DataTypes.STRING, allowNull: true },
    bookId: { type: DataTypes.INTEGER, references: { model: 'BookTicket', key: 'id' }, allowNull: false },
    EPaymentId: { type: DataTypes.INTEGER, references: { model: 'EPayment', key: 'id' }, allowNull: false },
    BaseInvoice: { type: DataTypes.INTEGER, allowNull: true },
    RefundInvoice: { type: DataTypes.INTEGER, allowNull: true },
    RefundInvoiceDate: { type: DataTypes.DATE, allowNull: true },
    RefundAmount: { type: DataTypes.INTEGER, allowNull: true },
    RefundCommission: { type: DataTypes.INTEGER, allowNull: true },
    TaxSender: { type: DataTypes.INTEGER, allowNull: true },
    isRefunded: { type: DataTypes.BOOLEAN, defaultValue: false },
    RecipientFullName: { type: DataTypes.STRING, allowNull: true },
    RecipientPan: { type: DataTypes.STRING, allowNull: true },
    RecipientPhone: { type: DataTypes.STRING, allowNull: true },
    resendCount: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    tableName: 'MTNEPayment',
    modelName: 'MTNEPayment',
    timestamps: true,
    indexes: [{ fields: ['Invoice'], unique: true }],
  },
);

export default MTNEPayment;
