import { Request, Response } from "express";

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
  req: Request,
  res: Response,
  error: IErrorResponse,
  path: string,
) => {
  return res.status(error.statusCode).json({
    success: false,
    error,
    path,
    timestamp: new Date().toISOString(),
    requestId: req.headers["x-request-id"] || crypto.randomUUID(),
  });
};

export default AppErrorResponse;
