import { Response } from "express";

interface IResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  path?: string;
}
const AppResponse = <T>(res: Response, payload: IResponse<T>) => {
  const { statusCode, success, message, data, path, meta } = payload;

  return res.status(statusCode).json({ success, message, data, path, meta });
};

export default AppResponse;
