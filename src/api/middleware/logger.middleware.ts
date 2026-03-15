import { ENVIRONMENT_CONFIG } from "@config";
import type { NextFunction, Request, Response } from "express";
import winston from "winston";

const { combine, timestamp, json, prettyPrint, errors } = winston.format;

const isProd = ENVIRONMENT_CONFIG.NODE_ENV === "production";

const logger = winston.createLogger({
  level: ENVIRONMENT_CONFIG.LOG_LEVEL,
  format: combine(timestamp(), errors({ stack: true }), isProd ? json() : prettyPrint()),
  transports: [new winston.transports.Console()],
});

function sanitizeHeaders(headers: Record<string, any>) {
  const cloned = { ...headers } as Record<string, any>;
  if (cloned.authorization) cloned.authorization = "****";
  return cloned;
}

function shouldLogBody(req: Request) {
  if (isProd) return false;
  // don't log bodies for GET requests
  return req.method !== "GET";
}

export default function loggingHandler(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  logger.info(`incoming request`, {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
  });

  res.on("finish", () => {
    const duration = Date.now() - start;
    const meta: Record<string, any> = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: duration,
      headers: sanitizeHeaders(req.headers as Record<string, any>),
    };
    if (shouldLogBody(req)) meta.body = req.body;

    logger.info(
      `${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${duration}ms`,
      meta,
    );
  });

  next();
}

export { logger };
