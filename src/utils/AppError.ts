interface CustomError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  fields?: string[];
}

class AppError extends Error implements CustomError {
  public statusCode: number;

  public status: string;

  public isOperational: boolean;

  public fields?: string[] | [];

  // public details?: any;

  constructor(message: string, statusCode: number, fieldsName?: string[]) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.fields = fieldsName;
    // this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;

