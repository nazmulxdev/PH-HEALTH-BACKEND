import { Response } from "express";

interface IResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  path?: string;
}
const AppResponse = <T>(res: Response, payload: IResponse<T>) => {
  const { statusCode, success, message, data, path } = payload;

  return res.status(statusCode).json({ success, message, data, path });
};

export default AppResponse;
