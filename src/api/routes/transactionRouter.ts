import { Router } from "express";
import { TransactionController } from "../controllers";
import { authenticationHandler } from "../middleware/auth.middleware.js";
import type { PrismaClient } from "@prisma/client";

export default function transactionRouter(prisma: PrismaClient) {
  const transactionRouter = Router();

  const transactionController = new TransactionController(prisma);

  transactionRouter.get(
    "/",
    authenticationHandler,
    transactionController.getTransactions.bind(transactionController),
  );

  transactionRouter.get(
    "/:transactionId",
    authenticationHandler,
    transactionController.getTransactionById.bind(transactionController),
  );

  transactionRouter.post(
    "/",
    authenticationHandler,
    transactionController.createTransaction.bind(transactionController),
  );

  return transactionRouter as Router;
}
