import type { PrismaClient } from "@prisma/client";
import { ok } from "assert";
import crypto from "crypto";

export function transactionService(prisma: PrismaClient) {
  async function addTransaction(params) {
    const { userId, amount, description, date } = params;

    if (!userId) {
      return { ok: false, code: 400, message: "User ID is required" };
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return { ok: false, code: 404, message: "User not found" };
      }

      const transaction = await prisma.transaction.create({
        data: {
          userId: userId,
          amount: amount,
          description: description,
          dateCreated: date,
        },
      });
      return { ok: true, code: 201, transaction: transaction };
    } catch (error) {
      return { ok: false, code: 500, message: "Internal server error", internal: String(error) };
    }
  }

  async function fetchTransactions(params) {
    console.log("transaction router");
  }

  async function fetchTransactionForId(params) {
    const { id, userId } = params;

    if (!userId) {
      return { ok: false, code: 400, message: "User ID is required" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { ok: false, code: 404, message: "User not found" };
    }

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
