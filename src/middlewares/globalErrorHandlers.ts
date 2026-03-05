/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request, Response } from "express";

import { ZodError } from "zod";
import config from "../config/env";
import AppError from "../shared/AppError";
import { Prisma } from "../generated/prisma/client";
import AppErrorResponse from "../shared/AppErrorResponse";

const globalErrorHandler = (error: unknown, req: Request, res: Response) => {
  let statusCode = 500;
  let message = "Internal server error.";
  let name = (error as any)?.name || "Error";
  let code: string | undefined = undefined;
  let details: { field?: string; message: string }[] | undefined = undefined;

  if (config.node_env !== "production") {
    console.error("ERROR:", error);
  }

  //    better-auth errors
  const isAuthError = (
    err: unknown,
  ): err is { code: string; message?: string } => {
    return (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      typeof (err as any).code === "string"
    );
  };

  //  Custom AppError
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    name = error.name;
    code = error.code;
    details = error.details;
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
  } else if (error instanceof Error && error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
    name = "AuthError";
  }
  //  Prisma errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        statusCode = 409;
        message = `Duplicate value for field ${(error.meta as any)?.target}`;
        name = "DatabaseError";
        code = "P2002";
        break;
      case "P2025":
        statusCode = 404;
        message = "Resource not found";
        name = "DatabaseError";
        code = "P2025";
        break;
      default:
        statusCode = 400;
        message = "Database error";
        name = "DatabaseError";
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
    switch (error.errorCode) {
      case "P1000":
        statusCode = 401;
        message = "Database authentication failed";
        break;
      case "P1001":
        statusCode = 400;
        message = "Cannot reach database server";
        break;
      case "P1002":
        statusCode = 400;
        message = "Database failed";
        break;
      default:
        statusCode = 400;
        message = "Database initialization error";
    }
    name = "DatabaseError";
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
  // Better-auth errors
  else if (isAuthError(error)) {
    const authError = error as { code: string; message?: string };
    name = "AuthError";
    code = authError.code;

    switch (authError.code) {
      case "INVALID_CREDENTIALS":
        statusCode = 401;
        message = "Invalid email or password";
        break;
      case "EMAIL_ALREADY_EXISTS":
        statusCode = 409;
        message = "Email already registered";
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
      // case "VALIDATION_ERROR": // handle better-auth validation errors
      //   statusCode = 400;
      //   message = "Validation failed";
      //   const matchedField = authError.message?.match(/\[body.(.+?)\]/)?.[1];
      //   details = [
      //     {
      //       ...(matchedField !== undefined ? { field: matchedField } : {}),
      //       message: authError.message?.replace(/\[body\..+?\]\s*/, "") || "",
      //     },
      //   ];
      //   break;
      default:
        statusCode = 400;
        message = authError.message || "Authentication error";
    }
  } else {
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
