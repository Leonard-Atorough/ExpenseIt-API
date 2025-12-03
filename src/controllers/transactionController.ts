import type { PrismaClient } from "@prisma/client";
import { transactionService } from "../services/transactionService.js";
import type { Request, Response, NextFunction } from "express";

export function transactionController(prisma: PrismaClient) {
  const { fetchTransactions, fetchTransactionForId, addTransaction } = transactionService(prisma);

  async function createTransaction(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { amount, description, date } = req.body;

    try {
      const result = await addTransaction({
        userId,
        amount,
        description,
        date: new Date(date),
      });

      if (!result.ok) {
        return res.status(result.code ?? 400).json({ message: result.message });
      }

      res.status(result.code ?? 201);
      if (result.transaction?.id) {
        res.setHeader("Location", `/transactions/${result.transaction.id}`);
      }
      return res.json(result.transaction);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      res.status(500).send("An error occurred while creating the transaction.");
      return next(error);
    }
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

  async function getTransactions(req: Request, res: Response, next: NextFunction) {
    res.send("Hello from transaction controller");
  }

  return { getTransactions, getTransactionById, createTransaction };
}
