import "dotenv/config";
import { authService } from "../services/authService.js";
import { emailService } from "../services/emailService.ts";
import { parseExpiryToMs } from "../utils/timeUtils.ts";
import type { PrismaClient } from "@prisma/client";
import type { Request, Response, NextFunction } from "express";

// Missing features: account verification, password reset, multi-factor authentication.
export function authController(prisma: PrismaClient) {
  const authenticationService = authService(prisma);
  const emailServiceInstance = emailService(prisma);

  async function register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    console.log("Handling registration request");

    const { firstName, lastName, email, password } = req.body as RegisterRequest;

    if (!firstName || !email || !password)
      return res.status(400).json({ message: "Required fields missing." });

    try {
      const result = await authenticationService.register({ firstName, lastName, email, password });

      if (!result.ok) {
        return res
          .status(result.code)
          .json({ message: "message" in result ? result.message : "Registration failed" });
      }

      console.log("Registration successful for user:", result.user.email);

      emailServiceInstance.sendVerificationEmail(email, result.activationToken).catch((err) => {
        console.error("Error sending verification email:", err);
      });

      return res.status(result.code).json({ user: result.user });
    } catch (err) {
      console.error("Failed to register account", err);
      next(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async function verify(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    console.log("Handling registration confirmation request");
    const { token } = req.query;
    if (!token || typeof token !== "string")
      return res.status(400).json({ message: "Verification token missing or invalid" });

    try {
      const result = await authenticationService.verify({ token });
      if (!result.ok) {
        return res
          .status(result.code)
          .json({ message: "message" in result ? result.message : "Verification failed" });
      }
      console.log("Account verification successful for token:", token);

      return res.status(result.code).json({ message: "Account verified successfully" });
    } catch (err) {
      console.error("Failed to verify account", err);
      next(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async function login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    console.log("Handling login request");
    try {
      const { email, password } = req.body as LoginRequest;
      if (!email || !password) return res.status(400).json({ message: "Required fields missing" });

      const ip = req.ip;
      const userAgent = req.get("User-Agent") ?? "";

      const result = await authenticationService.login({ email, password, ip, userAgent });

      if (!result.ok)
        return res
          .status(result.code)
          .json({ message: "message" in result ? result.message : "Login failed" });

      const { accessToken, refreshToken, user } = result.data;

      //for more info on res and all its methods https://expressjs.com/en/5x/api.html#res
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === "true",
        path: "/auth/refresh",
        maxAge: parseExpiryToMs(process.env.REFRESH_TOKEN_EXP || "7d"),
        sameSite: "lax",
      });

      console.log("Login successful, tokens set");
      // In the future we can consider adding roles/permissions to the user object here
      // and we can also consider sending an 2FA email if we implement multi-factor authentication (research needed)
      return res.status(result.code).json({ accessToken, user });
    } catch (err) {
      console.error("Failed login", err);
      next(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async function refresh(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    console.log("Handling token refresh request");
    const rawRefresh = req.cookies.refreshToken as string;
    if (!rawRefresh) return res.status(401).json({ message: "No refresh token provided" });

    try {
      const result = await authenticationService.refresh({ rawRefresh });

      if (!result.ok)
        return res
          .status(result.code)
          .json({ message: "message" in result ? result.message : "Refresh failed" });
      // TODO - Log the refresh event. Question is where to log it. Maybe a new collection/table for auth events?
      const { token, refreshToken } = result.data;

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === "true",
        path: "/auth/refresh",
        maxAge: parseExpiryToMs(process.env.REFRESH_TOKEN_EXP || "7d"),
        sameSite: "lax",
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === "true",
        path: "/auth/logout",
        maxAge: parseExpiryToMs(process.env.REFRESH_TOKEN_EXP || "7d"),
        sameSite: "lax",
      });

      console.log("Token refresh successful, new tokens set");
      return res.status(result.code).json({ accessToken: token });
    } catch (err) {
      console.error("Failed refresh", err);
      next(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async function logout(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    console.log("Handling logout request");

    const rawRefresh = req.cookies.refreshToken as string;
    if (!rawRefresh) return res.status(400).json({ message: "No refresh token provided" });

    try {
      const result = await authenticationService.logout({ rawRefresh });
      if (!result.ok)
        return res
          .status(result.code)
          .json({ message: "message" in result ? result.message : "Logout failed" });

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === "true",
        path: "/auth/refresh",
        sameSite: "lax",
      });

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === "true",
        path: "/auth/logout",
        sameSite: "lax",
      });

      console.log("Logout successful, refresh token cleared");
      return res.status(result.code).json({ message: "Logged out successfully" });
    } catch (err) {
      console.error("Failed logout", err);
      next(err instanceof Error ? err : new Error(String(err)));
    }
  }

  interface RegisterRequest {
    firstName: string;
    lastName?: string;
    email: string;
    password: string;
  }
  interface LoginRequest {
    email: string;
    password: string;
    ip?: string;
    userAgent?: string;
  }
  return { register, verify, login, refresh, logout };
}
