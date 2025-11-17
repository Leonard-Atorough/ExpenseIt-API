import { Router } from "express";
import { transactionController } from "../controllers/transactionController.js";

export default function transactionRoutes(prisma) {
  const transactionRouter = Router();
  const { getTransactions, getTransactionById, createTransaction } = transactionController(prisma);

  transactionRouter.get("/", getTransactions);
  transactionRouter.get("/:transactionId", getTransactionById);
  transactionRouter.post("/", createTransaction);

  return transactionRouter;
}
