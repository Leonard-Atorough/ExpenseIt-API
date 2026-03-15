import express, { type Application } from "express";
import cors from "cors";
import { ENVIRONMENT_CONFIG } from "./config";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";
import swaggerUi from "swagger-ui-express";
import yaml from "js-yaml";
import { createPrismaClient } from "./src/infrastructure/config/prisma";
import { createAuthRouter, createTransactionRouter, createUserRouter } from "./src/api/routes";
import errorHandler from "./src/api/middleware/error.middleware";
import { loggingHandler } from "@src/api/middleware/index.js";
import { healthcheckProvider } from "@src/infrastructure/healthchecks/healthcheckProvider";
import helmet from "helmet";

interface ApplicationWithSwagger extends Application {
  useSwaggerDocumentation: () => void;
}

export function createApp(): ApplicationWithSwagger {
  const SWAGGER_DOCUMENTATION_PATH = "documentation/api/v1/openapi.yaml";

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const swaggerDocument = yaml.load(
    readFileSync(join(__dirname, SWAGGER_DOCUMENTATION_PATH), "utf8"),
  ) as object;

  const prismaClient = createPrismaClient();

  const app: ApplicationWithSwagger = express() as unknown as ApplicationWithSwagger;

  app.useSwaggerDocumentation = () => {
    if (ENVIRONMENT_CONFIG.NODE_ENV !== "production") {
      app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    }
  };

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          scriptSrc: [
            "'self'",
            "https://cdn.jsdelivr.net/npm/swagger-ui-dist@4.15.5/swagger-ui-bundle.js",
          ],
          styleSrc: [
            "'self'",
            "https://cdn.jsdelivr.net/npm/swagger-ui-dist@4.15.5/swagger-ui.css",
          ],
        },
      },
    }),
  );
  app.use(
    cors({
      origin: ENVIRONMENT_CONFIG.CLIENT_ORIGIN,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "User-Agent",
        "X-Forwarded-For",
        "X-Test-Token",
      ],
    }),
  );
  app.use(express.json({ strict: false }));
  app.use(cookieParser());
  app.useSwaggerDocumentation();
  app.use(loggingHandler);

  app.get("/healthcheck", (_req, res) => {
    // Get the current health status from the provider
    const healthStatus = healthcheckProvider.getHealthStatus();
    res.json(healthStatus);
  });

  app.get("/ping", (_req, res) => {
    res.status(200).json({ id: 1, data: "Welcome to the ExpenseIt-API" });
  });

  app.use("/api/auth", createAuthRouter(prismaClient));
  app.use("/api/transactions", createTransactionRouter(prismaClient));
  app.use("/api/profile", createUserRouter(prismaClient));

  app.use(errorHandler);

  return app;
}
