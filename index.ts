import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRouter from "./src/routes/authRouter.js";
import { createPrismaClient } from "./src/config/prisma.ts";
import transactionRouter from "./src/routes/transactionRouter.js";
import errorHandler from "./src/middleware/error.middleware.js";

dotenv.config();

const app = express();

const prisma = createPrismaClient();

// NOTE: Allowing all cross origin requests for now, need to consider restricting routes when on servers
app.use(cors());

app.use(express.json());

app.use(cookieParser());

app.use("/auth", authRouter(prisma));

app.use("/transactions", transactionRouter(prisma));

app.get("/ping", (_req, res) => {
  res.status(200).json({ id: 1, data: "Welcome to the ExpenseIt-API" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async (error) => {
  if (error) throw error;

  console.log(`ExpenseIt API running on http://localhost:${PORT}/`);
});
