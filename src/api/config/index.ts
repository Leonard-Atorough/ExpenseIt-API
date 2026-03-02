import type { CookieOptions } from "express";
import { parseExpiryToMs } from "src/api/utils/timeUtils";

export const REFRESH_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === "true",
  path: "/api/auth",
  maxAge: parseExpiryToMs(process.env.REFRESH_TOKEN_EXP || "7d"),
  sameSite: "lax",
};
