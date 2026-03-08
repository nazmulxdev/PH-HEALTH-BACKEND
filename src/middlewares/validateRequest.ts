import { NextFunction, Request, Response } from "express";
import * as z from "zod";
import catchAsync from "../shared/catchAsync";

interface IValidationSchema {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
  headers?: z.ZodType;
  cookies?: z.ZodType;
}

const validateRequest = (schema: IValidationSchema) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (schema.body) {
      const result = await schema.body.safeParseAsync(req.body);
      if (!result.success) {
        next(result.error);
        return;
      }
      req.body = result.data;
    }
    if (schema.params) {
      const result = await schema.params.safeParseAsync(req.params);
      if (!result.success) {
        next(result.error);
        return;
      }
      req.params = result.data as Record<string, string>;
    }

    if (schema.query) {
      const result = await schema.query.safeParseAsync(req.query);
      if (!result.success) {
        next(result.error);
        return;
      }
      req.query = result.data as Record<string, string>;
    }

    if (schema.headers) {
      const result = await schema.headers.safeParseAsync(req.headers);
      if (!result.success) {
        next(result.error);
        return;
      }
    }
    if (schema.cookies) {
      const result = await schema.cookies.safeParseAsync(req.cookies);
      if (!result.success) {
        next(result.error);
        return;
      }
    }
    next();
  });
};

export default validateRequest;
