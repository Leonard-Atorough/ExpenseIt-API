import type { PrismaClient } from "@prisma/client";
import { transactionService } from "../services/transactionService.js";
import type { Request, Response, NextFunction } from "express";

export function transactionController(prisma: PrismaClient) {
  const { fetchTransactions, fetchTransactionForId, addTransaction } = transactionService(prisma);

  async function getTransactions(req: Request, res: Response, next: NextFunction) {
    res.send("Hello from transaction controller");
  }

  async function getTransactionById(req: Request, res: Response, next: NextFunction) {
    const { transactionId } = req.params;
    const id = parseInt(transactionId);
    const userId = req.user?.sub;

    try {
      const result = await fetchTransactionForId({ id: id, userId: userId });

      if (result.result === "not-found") {
        res.status(404).json({ error: "Transaction not found or access denied" });
      } else {
        res.status(200).json(result.transaction);
      }
    } catch (error) {
      res.status(500).send("Oops! Something went wrong on our end. We'll look into it.");
      next(new Error(error));
    }
  }

  async function createTransaction(req: Request, res: Response, next: NextFunction) {}

  return { getTransactions, getTransactionById, createTransaction };
}
