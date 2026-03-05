import { Response } from "express";

interface IErrorDetail {
  field?: string;
  message: string;
}

interface IErrorResponse {
  statusCode: number;
  name: string;
  code?: string | undefined;
  message: string;
  details?: IErrorDetail[];
}

const AppErrorResponse = (
  res: Response,
  error: IErrorResponse,
  path: string,
) => {
  return res.status(error.statusCode).json({
    success: false,
    error,
    path,
    timestamp: new Date().toISOString(),
  });
};

export default AppErrorResponse;
