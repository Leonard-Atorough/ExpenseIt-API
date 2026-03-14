import type { PrismaClient } from "@prisma/client";
import { TransactionMapper } from "@src/application/mappers/transaction.mapper";
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

  async save(transaction: Transaction): Promise<Transaction> {
    const data = TransactionMapper.toPersistence(transaction);
    const created = await this.client.transaction.create({
      data,
    });
    return TransactionMapper.toDomain(created);
  }

  update(transaction: Transaction): Promise<Transaction> {
    throw new Error("Method not implemented.");
  }
  delete(id: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
