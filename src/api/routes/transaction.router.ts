import { Router } from "express";
import { TransactionController } from "../controllers";
import { authenticationHandler } from "../middleware";
import type { PrismaClient } from "@prisma/client";
import { TransactionService } from "@src/application/services";
import { TransactionRepository } from "@src/infrastructure/repositories";

export default function createTransactionRouter(prisma: PrismaClient) {
  const transactionRouter = Router();

  const transactionController = new TransactionController(new TransactionService(new TransactionRepository(prisma)));

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
