import type { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwtUtils";
import { ENVIRONMENT_CONFIG } from "@config";
import { logger } from "@src/api/middleware/index.js";

export default async function authenticationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || typeof authHeader !== "string") {
      return res.status(401).json({ error: "Unauthorized: Missing Authorization header" });
    }

    const parts = authHeader.trim().split(/\s+/);
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      return res.status(401).json({ error: "Unauthorized: Invalid Authorization header format" });
    }
    const token = parts[1];

    const jwtSecret = ENVIRONMENT_CONFIG.JWT_ACCESS_SECRET;

    if (!jwtSecret) {
      logger.error("JWT_ACCESS_SECRET is not defined in environment variables");
      return res.status(500).json({ error: "Internal Server Error: JWT secret not configured" });
    }
    const payload = await verifyJwt(token, jwtSecret);

    if (typeof payload !== "object" || !payload.sub) {
      return res.status(401).json({ error: "Unauthorized: Invalid token payload" });
    }

    req.user = payload;
    next();
  } catch (err) {
    logger.error("Unauthorized: Invalid or expired token", { error: err });
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
}
