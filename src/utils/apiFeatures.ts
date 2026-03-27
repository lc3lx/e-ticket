/* eslint-disable @typescript-eslint/no-explicit-any */
import { FindOptions, WhereOptions, Order, Model, ModelStatic, Op, Transaction, DataTypes } from 'sequelize';
// import { Transaction } from '../DB/sequelize.js';

const operatorMap: { [key: string]: symbol } = {
  gte: Op.gte,
  gt: Op.gt,
  lte: Op.lte,
  lt: Op.lt,
};

interface QueryString {
  page?: string;
  sort?: string;
  limit?: string;
  fields?: string;
  user?: string;
  firstName?: string;
  lastName?: string;
  isDeleted?: string;
  isBlocked?: string;
  createdAt?: Date;
  age?: string;
  [key: string]: string | undefined | object;
}

class APIFeatures<T extends Model> {
  public query: FindOptions;

  public page: number;

  public limit: number;

  private queryString: QueryString;

  public model: ModelStatic<T>;

  constructor(
    model: ModelStatic<T>,
    queryString: QueryString,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public options: any = {},
  ) {
    this.query = {};
    this.queryString = queryString;
    this.model = model;
    this.page = 1;
    this.limit = 10;
  }

  filter(): this {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach((el) => delete queryObj[el]);

    const where: WhereOptions = {};
    type IncludeWhereOptions = Record<string, Record<string, any>>;
    const includeWhere: IncludeWhereOptions = {};

    if (queryObj.age) {
      const today = new Date();
      const ageValue = queryObj.age as { gte?: string; lte?: string };
      if (ageValue.gte) {
        const birthdateMax = new Date(today.setFullYear(today.getFullYear() - Number(ageValue.gte)));
        where.birthDate = { [Op.lte]: birthdateMax };
        delete queryObj.age;
      }
      if (ageValue.lte) {
        const birthdateMin = new Date(today.setFullYear(today.getFullYear() - Number(ageValue.lte)));
        where.birthDate = { ...where.birthDate, [Op.gte]: birthdateMin };
        delete queryObj.age;
      }
    }

    Object.keys(queryObj).forEach((key) => {
      const value = queryObj[key];

      if (['startEventDate', 'endEventDate', 'startApplyDate', 'endApplyDate'].includes(key)) {
        const dateValue = value as string | { gte?: string; lte?: string };

        if (typeof dateValue === 'object' && (dateValue.gte || dateValue.lte)) {
          if (dateValue.gte) {
            const gteParts = dateValue.gte.split('-');
            if (gteParts.length === 3) {
              const gteDate = new Date(`${gteParts[2]}-${gteParts[1]}-${gteParts[0]}`);
              const startOfGteDay = new Date(
                Date.UTC(gteDate.getFullYear(), gteDate.getMonth(), gteDate.getDate(), 0, 0, 0),
              );
              where[key] = { ...where[key], [Op.gte]: startOfGteDay };
            }
          }
          if (dateValue?.lte) {
            const lteParts = dateValue.lte.split('-');
            if (lteParts.length === 3) {
              const lteDate = new Date(`${lteParts[2]}-${lteParts[1]}-${lteParts[0]}`);
              const endOfLteDay = new Date(
                Date.UTC(lteDate.getFullYear(), lteDate.getMonth(), lteDate.getDate(), 23, 59, 59),
              );
              where[key] = { ...where[key], [Op.lte]: endOfLteDay };
            }
          }
        } else if (typeof dateValue === 'string') {
          const dateParts: string[] = dateValue.split('-');
          if (dateParts.length === 3) {
            const formattedDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);

            const startOfDay = new Date(
              Date.UTC(formattedDate.getFullYear(), formattedDate.getMonth(), formattedDate.getDate(), 0, 0, 0),
            );

            const endOfDay = new Date(
              Date.UTC(formattedDate.getFullYear(), formattedDate.getMonth(), formattedDate.getDate(), 23, 59, 59),
            );

            where[key] = {
              [Op.gte]: startOfDay,
              [Op.lte]: endOfDay,
            };
          }
        }
      } else if (key === 'priceFilter') {
        where[Op.or as any] = this.handlePriceFilterForAllTicketTypes(value);
      } else if (key.startsWith('ticketOptionsAndPrices') && key.includes('price')) {
        const [, ticketType, priceField] = key.split('.');

        if (!where.ticketOptionsAndPrices) {
          where.ticketOptionsAndPrices = {};
        }

        if (priceField === 'price') {
          where[`ticketOptionsAndPrices.${ticketType}.price`] = this.handlePriceFiltering(value);
        }
      } else if (key.startsWith('ticketOptionsAndPrices') && !key.includes('price')) {
        const [, ticketType] = key.split('.');
        where[`ticketOptionsAndPrices.${ticketType}`] = { [Op.ne]: null };
      } else if (key.includes('.')) {
        const [association, field] = key.split('.');

        if (!includeWhere[association]) {
          includeWhere[association] = {};
        }

        if (typeof value === 'object' && value !== null) {
          includeWhere[association][field] = {};
          Object.keys(value).forEach((operatorKey) => {
            const operator = operatorMap[operatorKey];
            if (operator) {
              (includeWhere[association][field] as Record<symbol, unknown>)[operator] = this.convertToCorrectType(
                (value as { [key: string]: string })[operatorKey],
              );
            }
          });
        } else {
          includeWhere[association][field] = this.convertToCorrectType(value);
        }
      } else {
        // eslint-disable-next-line no-lonely-if
        if (typeof value === 'object' && value !== null) {
          where[key] = {};
          Object.keys(value).forEach((operatorKey) => {
            const operator = operatorMap[operatorKey];
            if (operator) {
              (where[key] as Record<symbol, unknown>)[operator] = this.convertToCorrectType(
                (value as { [key: string]: string })[operatorKey],
              );
            }
          });
        } else {
          where[key] = this.convertToCorrectType(value);
        }
      }
    });
    this.query.where = where;

    if (Object.keys(includeWhere).length > 0) {
      this.options.include.forEach((include: any) => {
        if (includeWhere[include.as]) {
          include.where = includeWhere[include.as];
        }
      });
    }
    return this;
  }

  sort(): this {
    //TODO: here
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').map((field) => {
        if (field.startsWith('-')) {
          return [field.slice(1), 'DESC'];
        }
        return [field, 'ASC'];
      });
      this.query.order = sortBy as Order;
    } else {
      this.query.order = [['createdAt', 'DESC']] as Order;
    }
    return this;
  }

  limitFields(): this {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',') as Array<keyof T>;
      this.query.attributes = fields.map((field) => field.toString());
    } else {
      this.query.attributes = { exclude: ['__v'] };
    }
    return this;
  }

  paginate(): this {
    this.page = parseInt(this.queryString.page || '1', 10);
    this.limit = parseInt(this.queryString.limit || '10', 10);
    const offset = (this.page - 1) * this.limit;

    this.query.limit = this.limit;
    this.query.offset = offset;

    return this;
  }

  search(): this {
    if (this.queryString.search) {
      const searchTerm = this.queryString.search;
      const modelName = this.model.name as keyof typeof this.searchableFields;
      const fields = this.searchableFields[modelName] || [];

      const orConditions: WhereOptions[] = [];
      fields.forEach((field: string) => {
        // --------------------------------------------
        if (field.startsWith('$') && field.endsWith('$')) {
          const clean = field.replace(/\$/g, '');
          const [association, assocField] = clean.split('.');

          orConditions.push({
            [`$${association}.${assocField}$`]: { [Op.iLike]: `%${searchTerm}%` },
          });

          return;
        }

        const attr = this.model.rawAttributes[field];

        if (!attr) return;

        // Handle text-based fields
        if (
          attr.type instanceof DataTypes.STRING ||
          attr.type instanceof DataTypes.TEXT ||
          attr.type instanceof DataTypes.UUID
        ) {
          orConditions.push({
            [field]: { [Op.iLike]: `%${searchTerm}%` },
          });
        }

        // Handle numeric fields if the search term is numeric
        else if (
          attr.type instanceof DataTypes.INTEGER ||
          attr.type instanceof DataTypes.BIGINT ||
          attr.type instanceof DataTypes.FLOAT ||
          attr.type instanceof DataTypes.DECIMAL
        ) {
          if (!isNaN(Number(searchTerm))) {
            orConditions.push({
              [field]: { [Op.eq]: Number(searchTerm) },
            });
          }
        }
      });
      if (orConditions.length > 0) {
        this.query.where = {
          ...(this.query.where || {}),
          [Op.or]: orConditions,
        };
      }
    }

    return this;
  }

  async execute(transaction?: Transaction): Promise<T[]> {
    const finalQuery = { ...this.query, ...this.options };

    if (this.query.where && this.options.where) {
      finalQuery.where = { ...this.query.where, ...this.options.where };
    }
    if (transaction) {
      finalQuery.transaction = transaction;
    }
    return this.model.findAll({ ...finalQuery });
  }

  private convertToCorrectType(value: string | undefined): string | number | boolean | undefined {
    if (!value) return undefined;

    const parsedValue = parseFloat(value);
    if (!Number.isNaN(parsedValue)) return parsedValue;

    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    return value;
  }

  private handlePriceFilterForAllTicketTypes(value: any) {
    const ticketTypes = ['vip', 'classic', 'economy'];
    const conditions = ticketTypes.map((type) => ({
      [`ticketOptionsAndPrices.${type}.price`]: this.handlePriceFiltering(value),
    }));
    return conditions;
  }

  private handlePriceFiltering(value: any) {
    const whereClause: Record<symbol, number> = {};

    if (typeof value === 'object') {
      Object.keys(value).forEach((operatorKey) => {
        const operator = operatorMap[operatorKey];
        if (operator) {
          whereClause[operator] = this.convertToCorrectType(value[operatorKey]) as number;
        }
      });
    } else {
      whereClause[Op.eq] = this.convertToCorrectType(value) as number;
    }

    return whereClause;
  }

  private searchableFields = {
    Supervisor: ['username', 'workInfo', 'mobileNumber'],
    Event: ['eventName', 'description'],
    NormalUser: ['$user.firstName$', '$user.lastName$', 'mobileNumber'],
    ScannerUser: ['name'],
    DiscountCode: ['code', '$event.eventName$'],
    MTNEPayment: [
      'Invoice',
      'Phone',
      'Guid',
      'Tax',
      'Comission',
      'Transaction',
      'RefundInvoice',
      'OperationNumber',
      'Amount',
      'Expired',
    ],
  };
}

export default APIFeatures;
