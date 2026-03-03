import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import yaml from "js-yaml";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import errorHandler from "src/api/middleware/error.middleware";
import { authRouter, transactionRouter } from "src/api/routes";
import { createPrismaClient } from "src/infrastructure/config/prisma";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const swaggerDocument = yaml.load(
  readFileSync(join(__dirname, "documentation/api/v1/openapi.yaml"), "utf8"),
) as object;

const app = express();

const prisma = createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// NOTE: Allowing all cross origin requests for now, need to consider restricting routes when on servers
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "User-Agent", "X-Forwarded-For"],
  }),
);
app.use(express.json({ strict: false }));
app.use(cookieParser());

app.use("/api/auth", authRouter(prisma));
app.use("/api/transactions", transactionRouter(prisma));

app.get("/ping", (_req, res) => {
  res.status(200).json({ id: 1, data: "Welcome to the ExpenseIt-API" });
});

app.use(errorHandler);

const PORT = process.env.PORT;
if (!PORT) {
  throw new Error("PORT environment variable is not defined");
}

app.listen(PORT, async (error) => {
  if (error) throw error;
  console.log(`ExpenseIt API running on http://localhost:${PORT}/`);
});
