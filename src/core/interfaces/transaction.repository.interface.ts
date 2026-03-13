import type Transaction from "../entities/transactionAggregate/transaction";

export interface ITransactionRepository {
  getById(id: string, userId: string): Promise<Transaction | null>;
  getByUserId(userId: string): Promise<Transaction[]>;
  save(transaction: Transaction): Promise<Transaction>;
  update(transaction: Transaction): Promise<Transaction>;
  delete(id: string): Promise<void>;
}
