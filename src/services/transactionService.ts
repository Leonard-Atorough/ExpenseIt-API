import type { PrismaClient } from "@prisma/client";
import crypto from "crypto";

export function transactionService(prisma: PrismaClient) {
  async function addTransaction(params) {
    const { userId, amount, description, date } = params;

    const transaction = await prisma.transaction.create({
      data: {
        userId: userId,
        amount: amount,
        description: description,
        dateCreated: date,
      },
    });
  }

  async function fetchTransactions(params) {
    console.log("transaction router");
  }

  async function fetchTransactionForId(params) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: params.id,
        userId: params.userId,
      },
    });

    if (!transaction) {
      return { result: "not-found" };
    }
    return { result: "found", transaction: transaction };
  }

  return { fetchTransactions, fetchTransactionForId, addTransaction };
}
