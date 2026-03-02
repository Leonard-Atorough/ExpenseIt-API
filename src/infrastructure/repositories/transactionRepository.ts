import type { PrismaClient } from "@prisma/client";
import type { Transaction } from "@src/core/entities";
import type { ITransactionRepository } from "@src/core/interfaces";

export class TransactionRepository implements ITransactionRepository {
  private client: PrismaClient;

  constructor(client: PrismaClient) {
    this.client = client;
  }
  getById(id: string, userId: string): Promise<Transaction | null> {
    throw new Error("Method not implemented.");
  }
  getByUserId(userId: string): Promise<Transaction[]> {
    throw new Error("Method not implemented.");
  }
  save(transaction: Transaction): Promise<Transaction> {
    throw new Error("Method not implemented.");
  }
  update(transaction: Transaction): Promise<Transaction> {
    throw new Error("Method not implemented.");
  }
  delete(id: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
