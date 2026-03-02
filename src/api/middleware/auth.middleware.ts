// Router level authentication middleware to protect transaction routes
// Checks for valid JWT in Authorization header
// If valid, attaches user info to req.user and calls next()
// If invalid or missing, returns 401 Unauthorized
// Usage: app.use('/transactions', authenticationMiddleware, transactionRouter)

import type { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwtUtils";

export async function authenticationHandler(req: Request, res: Response, next: NextFunction) {
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

    const jwtSecret = process.env.JWT_ACCESS_SECRET;

    if (!jwtSecret) {
      console.error("JWT_ACCESS_SECRET is not defined in environment variables");
      return res.status(500).json({ error: "Internal Server Error: JWT secret not configured" });
    }
    const payload = await verifyJwt(token, jwtSecret);

    if (typeof payload !== "object" || !payload.sub) {
      return res.status(401).json({ error: "Unauthorized: Invalid token payload" });
    }

    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
}
