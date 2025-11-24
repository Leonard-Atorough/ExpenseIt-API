// Router level authentication middleware to protect transaction routes
// Checks for valid JWT in Authorization header
// If valid, attaches user info to req.user and calls next()
// If invalid or missing, returns 401 Unauthorized
// Usage: app.use('/transactions', authenticationMiddleware, transactionRouter)

import { verifyJwt } from "../utils/jwtUtils.ts";
import type { Request, Response, NextFunction } from "express";

export async function authenticationHandler(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || typeof authHeader !== "string") {
    return res.status(401).json({ error: "Unauthorized: Missing Authorization header" });
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return res.status(401).json({ error: "Unauthorized: Invalid Authorization header format" });
  }
  const token = parts[1];

  try {
    const payload = await verifyJwt(token, process.env.JWT_ACCESS_SECRET);
    // Attach all user info from payload to req.user
    req.payload = payload as Record<string, any>;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
}
