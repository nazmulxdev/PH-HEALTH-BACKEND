import { NextFunction, Request, Response } from "express";
import AppError from "../shared/AppError";
import status from "http-status";

const notFoundErrorHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  next(
    new AppError(
      status.NOT_FOUND,
      `can not ${req.method} from ${req.originalUrl} this path.`,
      "ERROR_PATH_REQUEST",
      [
        {
          field: "PATH",
          message: "Invalid path.",
        },
      ],
    ),
  );
};

export default notFoundErrorHandler;
