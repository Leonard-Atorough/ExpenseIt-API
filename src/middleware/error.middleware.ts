import type { Request, Response, NextFunction } from "express";

export interface CustomError extends Error {
  code?: number;
}

export default function errorHandler(
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log("Middlerware handling error");
  const errorStatus = err.code || 500;
  const errorMessage = err.message || "Internal Server Error";
  res.status(errorStatus).json({
    code: errorStatus,
    message: errorMessage,
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
  });
}
