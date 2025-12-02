import type { PrismaClient } from "@prisma/client";
import { transactionService } from "../services/transactionService.js";
import type { Request, Response, NextFunction } from "express";

export function transactionController(prisma: PrismaClient) {
  const { fetchTransactions, fetchTransactionForId, addTransaction } = transactionService(prisma);

  async function createTransaction(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.sub;
    const { amount, description, date } = req.body;

    // Input validation can be added here by calling a validation helper (consider using Zod or Joi)

    try {
      const result = await addTransaction({
        userId: userId,
        amount: amount,
        description: description,
        date: new Date(date),
      });
      // res.status(201).json(result);
    } catch (error) {
      res.status(500).send("Oops! Something went wrong on our end. We'll look into it.");
      next(new Error(error));
    }
  }

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

  return { getTransactions, getTransactionById, createTransaction };
}
