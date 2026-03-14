import type { PrismaClient } from "@prisma/client";
import { TransactionMapper } from "@src/application/mappers/transaction.mapper";
import type { Transaction } from "@src/core/entities";
import type { ITransactionRepository } from "@src/core/interfaces";

export class TransactionRepository implements ITransactionRepository {
  private client: PrismaClient;

  constructor(client: PrismaClient) {
    this.client = client;
  }

  /**
   * Fetches a transaction by its ID and the associated user ID. This ensures that users can only access their own transactions.
   *
   * @param id The unique identifier of the transaction to be fetched.
   * @param userId The unique identifier of the user to whom the transaction belongs. This is used to enforce access control.
   * @returns The transaction if found, otherwise null.
   */
  async getById(id: string, userId: string): Promise<Transaction | null> {
    const transaction = await this.client.transaction.findFirst({
      where: {
        id,
        userId,
      },
    });
    return transaction ? TransactionMapper.toDomain(transaction) : null;
  }

  /**
   * Fetches all transactions associated with a specific user ID.
   *
   * @param userId The unique identifier of the user whose transactions are to be fetched.
   * @return An array of transactions belonging to the specified user. If no transactions are found, an empty array is returned.
   */
  async getByUserId(userId: string): Promise<Transaction[]> {
    const transactions = await this.client.transaction.findMany({
      where: {
        userId,
      },
    });
    return Array.from(transactions).length > 0 ? transactions.map(TransactionMapper.toDomain) : [];
  }

  /**
   * Saves a new transaction to the database.
   *
   * @param transaction The transaction entity to be saved. This should be a fully constructed Transaction object that adheres to the domain model.
   * @returns The saved transaction, including any database-generated fields such as the unique identifier and timestamps.
   */
  async save(transaction: Transaction): Promise<Transaction> {
    const data = TransactionMapper.toPersistence(transaction);
    const created = await this.client.transaction.create({
      data,
    });
    return TransactionMapper.toDomain(created);
  }

  /**
   * Updates an existing transaction in the database.
   *
   * @param transaction The transaction entity containing the updated data. The transaction must have a valid ID that corresponds to an existing record in the database.
   * @returns The updated transaction after the changes have been persisted to the database. If the transaction does not exist, an error will be thrown by Prisma.
   */
  async update(transaction: Transaction): Promise<Transaction> {
    const data = TransactionMapper.toPersistence(transaction);
    const updated = await this.client.transaction.update({
      where: {
        id: transaction.id!,
      },
      data,
    });
    return TransactionMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.client.transaction.delete({
      where: {
        id,
      },
    });
  }
}
