import type { Request, Response, NextFunction } from "express";
import { ENVIRONMENT_CONFIG } from "@config";
import type { AppError } from "src/application/errors";
import type { ApiErrorResponse } from "@src/application/dtos/common/response.dto";

export interface CustomError extends Error {
  code?: number | string;
  statusCode?: number;
}

function getHttpStatusCode(error: AppError): number {
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
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log("Middleware handling error:", err.code, err.message);
  const errorStatus = getHttpStatusCode(err);
  const errorMessage = err.message || "Internal Server Error";
  res.status(errorStatus).json({
    ok: false,
    code: errorStatus,
    message: errorMessage,
    stack: ENVIRONMENT_CONFIG.NODE_ENV === "production" ? "🥞" : err.stack,
  } as ApiErrorResponse<string>);
}
