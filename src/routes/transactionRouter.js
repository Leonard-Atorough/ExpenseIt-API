import { Router } from "express";
import { transactionController } from "../controllers/transactionController.js";
import { authenticationHandler } from "../middleware/auth.middleware.js";

export default function transactionRouter(prisma) {
  const transactionRouter = Router();

  const { getTransactions, getTransactionById, createTransaction } = transactionController(prisma);

  transactionRouter.get("/", authenticationHandler, getTransactions);

  transactionRouter.get("/:transactionId", authenticationHandler, getTransactionById);

  transactionRouter.post("/", authenticationHandler, createTransaction);

  return transactionRouter;
}
