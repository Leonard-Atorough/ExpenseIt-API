import type { PrismaClient } from "@prisma/client";

export function transactionService(prisma: PrismaClient) {
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

  async function addTransaction(params) {}

  return { fetchTransactions, fetchTransactionForId, addTransaction };
}
