import type { Request, Response, NextFunction } from "express";
import { ENVIRONMENT_CONFIG } from "../../../config";

export interface CustomError extends Error {
  code?: number | string;
  statusCode?: number;
}

function getHttpStatusCode(error: CustomError): number {
  // If explicit statusCode is set, use it
  if (error.statusCode && typeof error.statusCode === "number") {
    return error.statusCode;
  }

  // If code is already a number, use it
  if (typeof error.code === "number") {
    return error.code;
  }

  // Map error codes to HTTP status codes
  const errorCodeMap: Record<string, number> = {
    ECONNREFUSED: 503,
    ENOTFOUND: 503,
    ETIMEDOUT: 504,
    P2002: 409, // Prisma unique constraint violation
    P2025: 404, // Prisma not found
  };

  if (typeof error.code === "string" && error.code in errorCodeMap) {
    return errorCodeMap[error.code];
  }

  return 500;
}

export default function errorHandler(
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log("Middleware handling error:", err.code, err.message);
  const errorStatus = getHttpStatusCode(err);
  const errorMessage = err.message || "Internal Server Error";
  res.status(errorStatus).json({
    code: errorStatus,
    message: errorMessage,
    stack: ENVIRONMENT_CONFIG.NODE_ENV === "production" ? "🥞" : err.stack,
  });
}
