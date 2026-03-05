class AppError extends Error {
  statusCode: number;
  code?: string | undefined;
  details?: { field?: string; message: string }[] | undefined;
  isOperational: boolean;
  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: { field?: string; message: string }[],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = this.constructor.name;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
