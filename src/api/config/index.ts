import type { CookieOptions } from "express";
import { parseExpiryToMs } from "src/api/utils/timeUtils";
import { ENVIRONMENT_CONFIG } from "@config";

export const REFRESH_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: ENVIRONMENT_CONFIG.COOKIE_HTTP_ONLY === "true",
  secure: ENVIRONMENT_CONFIG.COOKIE_SECURE === "true",
  path: "/api/auth",
  maxAge: parseExpiryToMs(ENVIRONMENT_CONFIG.REFRESH_TOKEN_EXPIRATION || "7d"),
  sameSite: ENVIRONMENT_CONFIG.COOKIE_SAME_SITE as "lax" | "strict" | "none",
};
