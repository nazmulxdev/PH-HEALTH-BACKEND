// import { NextFunction, Request,  Response,RequestHandler } from "express";

// const catchAsync = (fn: RequestHandler) => {
//   return async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await fn(req, res, next);
//     } catch (error: any) {
//       console.error(error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to create specialty.",
//         error: error.message,
//       });
//     }
//   };
// };

import { NextFunction, Request, Response } from "express";

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

const catchAsync =
  (fn: AsyncRequestHandler) =>
  (req: Request, res: Response, next: NextFunction): Promise<void> =>
    Promise.resolve(fn(req, res, next)).catch(next);

export default catchAsync;
