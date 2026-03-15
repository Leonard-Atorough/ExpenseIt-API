import { Router } from "express";
import { TransactionController } from "../controllers";
import { authenticationHandler, rateHandler, validationHandler } from "../middleware/index.js";
import type { PrismaClient } from "@prisma/client";
import { TransactionService } from "@src/application/services";
import { TransactionRepository } from "@src/infrastructure/repositories";
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
} from "@src/application/dtos/transaction";

export default function createTransactionRouter(prisma: PrismaClient) {
  const transactionRouter = Router();

  const transactionController = new TransactionController(
    new TransactionService(new TransactionRepository(prisma)),
  );

  const rateLimit = rateHandler(50, 15 * 60 * 1000);

  transactionRouter.use(rateLimit);

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
    validationHandler(CreateTransactionSchema),
    transactionController.createTransaction.bind(transactionController),
  );

  transactionRouter.put(
    "/:transactionId",
    authenticationHandler,
    validationHandler(UpdateTransactionSchema),
    transactionController.updateTransaction.bind(transactionController),
  );

  transactionRouter.delete(
    "/:transactionId",
    authenticationHandler,
    transactionController.deleteTransaction.bind(transactionController),
  );

  return transactionRouter as Router;
}
