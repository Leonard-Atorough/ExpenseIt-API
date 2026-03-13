function loadEnvironmentConfig(): EnvironmentConfig {
  require("dotenv").config();

  function isRequiredEnv(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (!value) {
      // check node env. if its dev, allow the default value
      if (process.env.NODE_ENV === "development" && defaultValue) {
        return defaultValue;
      }
      throw new Error(`Environment variable ${key} is required but not defined`);
    }
    return value;
  }
  const PORT = isRequiredEnv("PORT", "4000");
  const CLIENT_ORIGIN = isRequiredEnv("CLIENT_ORIGIN", "http://localhost:3000");
  const JWT_ACCESS_SECRET = isRequiredEnv("JWT_ACCESS_SECRET");
  const JWT_REFRESH_SECRET = isRequiredEnv("JWT_REFRESH_SECRET");
  const ACCESS_TOKEN_EXPIRATION = isRequiredEnv("ACCESS_TOKEN_EXPIRATION", "15m");
  const REFRESH_TOKEN_EXPIRATION = isRequiredEnv("REFRESH_TOKEN_EXPIRATION", "7d");
  const COOKIE_SECURE = isRequiredEnv("COOKIE_SECURE", "false");
  const DATABASE_URL = isRequiredEnv("DATABASE_URL");
  const EMAIL_USERNAME = isRequiredEnv("EMAIL_USERNAME", "");
  const EMAIL_PASSWORD = isRequiredEnv("EMAIL_PASSWORD", "");
  const VERIFICATION_TOKEN_EXPIRATION = isRequiredEnv("VERIFICATION_TOKEN_EXPIRATION", "1h");
  const LOG_LEVEL = isRequiredEnv("LOG_LEVEL", "info");
  const COOKIE_HTTP_ONLY = isRequiredEnv("COOKIE_HTTP_ONLY", "true");
  const COOKIE_SAME_SITE = isRequiredEnv("COOKIE_SAME_SITE", "lax");
  const NODE_ENV = process.env.NODE_ENV || "development";

  return {
    PORT,
    CLIENT_ORIGIN,
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    ACCESS_TOKEN_EXPIRATION,
    REFRESH_TOKEN_EXPIRATION,
    COOKIE_SECURE,
    DATABASE_URL,
    EMAIL_USERNAME,
    EMAIL_PASSWORD,
    VERIFICATION_TOKEN_EXPIRATION,
    LOG_LEVEL,
    COOKIE_HTTP_ONLY,
    COOKIE_SAME_SITE,
    NODE_ENV,
  };
}

export interface EnvironmentConfig {
  PORT: string;
  CLIENT_ORIGIN: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ACCESS_TOKEN_EXPIRATION: string;
  REFRESH_TOKEN_EXPIRATION: string;
  COOKIE_SECURE: string;
  COOKIE_HTTP_ONLY: string;
  COOKIE_SAME_SITE: string;
  DATABASE_URL: string;
  EMAIL_USERNAME: string;
  EMAIL_PASSWORD: string;
  VERIFICATION_TOKEN_EXPIRATION: string;
  LOG_LEVEL: string;
  NODE_ENV: string;
}

export const ENVIRONMENT_CONFIG: EnvironmentConfig = loadEnvironmentConfig();
