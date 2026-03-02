import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import errorHandler from "src/api/middleware/error.middleware";
import { authRouter, transactionRouter } from "src/api/routes";
import { createPrismaClient } from "src/infrastructure/config/prisma";

dotenv.config();

const app = express();

const prisma = createPrismaClient();

// NOTE: Allowing all cross origin requests for now, need to consider restricting routes when on servers
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "User-Agent", "X-Forwarded-For"],
  }),
);

app.use(express.json());

app.use(cookieParser());

app.use("/api/auth", authRouter(prisma));

app.use("/api/transactions", transactionRouter(prisma));

app.get("/ping", (_req, res) => {
  res.status(200).json({ id: 1, data: "Welcome to the ExpenseIt-API" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async (error) => {
  if (error) throw error;

  console.log(`ExpenseIt API running on http://localhost:${PORT}/`);

  const posts = await prisma.user.findMany();
  console.log(posts);
});
