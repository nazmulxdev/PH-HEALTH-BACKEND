/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextFunction, Request, Response } from "express";

import { ZodError } from "zod";
import AppError from "../shared/AppError";
import { Prisma } from "../generated/prisma/client";
import AppErrorResponse from "../shared/AppErrorResponse";
import { config } from "../config/env";

// better-auth APIError type
interface BetterAuthAPIError extends Error {
  status: string;
  statusCode: number;
  body: {
    code: string;
    message: string;
  };
}

interface NodeSystemError extends Error {
  code: string;
  syscall?: string;
}

//    better-auth errors
const isBetterAuthError = (err: unknown): err is BetterAuthAPIError => {
  return (
    err instanceof Error &&
    err.name === "APIError" &&
    "body" in err &&
    "statusCode" in err
  );
};

const isNodeSystemError = (err: unknown): err is NodeSystemError => {
  return (
    err instanceof Error &&
    "code" in err &&
    typeof (err as any).code === "string" &&
    (err as any).code.startsWith("E")
  );
};

const globalErrorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode = 500;
  let message = "Internal server error.";
  let name = (error as any)?.name || "Error";
  let code: string | undefined = undefined;
  let details: { field?: string; message: string }[] | undefined = undefined;

  if (config.NODE_ENV !== "production") {
    console.error("ERROR from globalErrorHandler:", error);
  }

  //  Custom AppError
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    name = error.name;
    code = error.code;
    details = error.details;
  }

  // Better-auth errors
  else if (isBetterAuthError(error)) {
    name = "AuthError";
    code = error.body?.code;

    switch (error.body?.code) {
      case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      case "EMAIL_ALREADY_EXISTS":
        statusCode = 409;
        message = "Email already registered";
        break;
      case "INVALID_CREDENTIALS":
        statusCode = 401;
        message = "Invalid email or password";
        break;
      case "USER_NOT_FOUND":
        statusCode = 404;
        message = "User not found";
        break;
      case "MISSING_OR_NULL_ORIGIN":
        statusCode = 403;
        message = "Origin not allowed";
        break;
      case "UNAUTHORIZED":
        statusCode = 401;
        message = "Unauthorized access";
        break;
      case "FORBIDDEN":
        statusCode = 403;
        message = "Access denied";
        break;
      case "SESSION_EXPIRED":
        statusCode = 401;
        message = "Session expired, please login again";
        break;
      case "RATE_LIMIT_EXCEEDED":
        statusCode = 429;
        message = "Too many requests, please try again later";
        break;
      case "VALIDATION_ERROR": {
        statusCode = 400;
        message = "Validation failed";
        const matchedField = error.body?.message?.match(/\[body.(.+?)\]/)?.[1];
        details = [
          {
            ...(matchedField !== undefined ? { field: matchedField } : {}),
            message: error.body?.message?.replace(/\[body\..+?\]\s*/, "") || "",
          },
        ];
        break;
      }
      default:
        statusCode =
          error.statusCode >= 400 && error.statusCode < 600
            ? error.statusCode
            : 400;
        message =
          error.body?.message || error.message || "Authentication error";
    }
  }

  //  Syntax error
  else if (error instanceof SyntaxError && "body" in error) {
    statusCode = 400;
    message = "Invalid JSON payload";
    name = "SyntaxError";
  }
  //  JWT errors
  else if (error instanceof Error && error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
    name = "AuthError";
  }

  // toke expired
  else if (error instanceof Error && error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
    name = "AuthError";
  }

  // token activation error
  else if (error instanceof Error && error.name === "NotBeforeError") {
    statusCode = 401;
    message = "Token not yet active";
    name = "AuthError";
  }

  //  Prisma errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    name = "DatabaseError";
    code = error.code;
    switch (error.code) {
      case "P2002":
        statusCode = 409;
        message = `Duplicate value for field: ${(error.meta as any)?.target}`;
        break;
      case "P2025":
        statusCode = 404;
        message = "Resource not found";
        break;
      case "P2003":
        statusCode = 400;
        message = "Foreign key constraint failed";
        break;
      case "P2014":
        statusCode = 400;
        message = "Relation violation error";
        break;
      case "P2016":
        statusCode = 400;
        message = "Query interpretation error";
        break;
      default:
        statusCode = 400;
        message = "Database error";
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid database input";
    name = "DatabaseValidationError";
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = 500;
    message = "Database query execution error";
    name = "DatabaseError";
  } else if (error instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = 500;
    message = "Critical database error";
    name = "DatabaseError";
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    name = "DatabaseError";
    switch (error.errorCode) {
      case "P1000":
        statusCode = 401;
        message = "Database authentication failed";
        break;
      case "P1001":
        statusCode = 503;
        message = "Cannot reach database server";
        break;
      case "P1002":
        statusCode = 503;
        message = "Database failed";
        break;
      default:
        statusCode = 500;
        message = "Database initialization error";
    }
  }
  //  Zod validation errors
  else if (error instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    name = "ValidationError";
    details = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  }

  // node.js system error
  else if (isNodeSystemError(error)) {
    name = "SystemError";
    switch (error.code) {
      case "ECONNREFUSED":
        statusCode = 503;
        message = "Service connection refused";
        break;
      case "ENOTFOUND":
        statusCode = 503;
        message = "Service not found";
        break;
      case "ETIMEDOUT":
        statusCode = 504;
        message = "Request timed out";
        break;
      case "ECONNRESET":
        statusCode = 503;
        message = "Connection reset";
        break;
      case "EPIPE":
        statusCode = 503;
        message = "Broken pipe error";
        break;
      default:
        statusCode = 500;
        message = error.message || "System error";
    }
  }

  // fallback error
  else {
    message = (error as any)?.message || message;
    name = (error as any)?.name || name;
  }

  return AppErrorResponse(
    res,
    {
      statusCode,
      name,
      ...(code ? { code } : {}),
      message,
      ...(details ? { details } : {}),
    },
    req.originalUrl,
  );
};

export default globalErrorHandler;
