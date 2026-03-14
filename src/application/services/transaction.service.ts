import type { ITransactionRepository } from "src/core/interfaces";
import type { CreateTransactionDto, TransactionResponseDto } from "../dtos";
import type Transaction from "src/core/entities/transactionAggregate/transaction";
import { TransactionMapper } from "../mappers/transaction.mapper";
import type { TransactionType } from "@src/core/entities/transactionAggregate/transactionType";

export class TransactionService {
  private transactionRepository: ITransactionRepository;
  constructor(transactionRepository: ITransactionRepository) {
    this.transactionRepository = transactionRepository;
  }
  async fetchTransactionById({
    id,
    userId,
  }: {
    id: string;
    userId: string;
  }): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.getById(id, userId);

    if (!transaction) {
      throw new Error("Transaction not found");
    }
    return TransactionMapper.toDto(transaction) as TransactionResponseDto;
  }

  async fetchTransactions(params: { userId: string }): Promise<TransactionResponseDto[]> {
    const { userId } = params;
    const transactions = await this.transactionRepository.getByUserId(userId);
    return transactions.map(
      (transaction: Transaction) => TransactionMapper.toDto(transaction) as TransactionResponseDto,
    );
  }

  async createTransaction(
    transaction: CreateTransactionDto,
    userId: string,
  ): Promise<TransactionResponseDto> {
    const newTransaction: Transaction = TransactionMapper.toDomain({
      ...transaction,
      userId,
    });

    const createdTransaction = await this.transactionRepository.save(newTransaction);

    if (!createdTransaction) {
      throw new Error("Failed to create transaction");
    }

    return TransactionMapper.toDto(createdTransaction) as TransactionResponseDto;
  }

  async updateTransaction(
    id: string,
    transaction: Partial<CreateTransactionDto>,
    userId: string,
  ): Promise<TransactionResponseDto> {
    const existingTransaction = await this.transactionRepository.getById(id, userId);

    if (!existingTransaction) {
      throw new Error("Transaction not found");
    }

    existingTransaction.update({
      amount: transaction.amount,
      type: transaction.type as TransactionType,
      category:
        transaction.category && transaction.category !== ""
          ? existingTransaction.convertStringToCategory(transaction.category)
          : undefined,
      description: transaction.description,
      date: transaction.transactionDate,
    });

    const savedTransaction = await this.transactionRepository.update(existingTransaction);

    if (!savedTransaction) {
      throw new Error("Failed to update transaction");
    }

    return TransactionMapper.toDto(savedTransaction) as TransactionResponseDto;
  }

  async deleteTransaction(id: string, userId: string): Promise<void> {
    const existingTransaction = await this.transactionRepository.getById(id, userId);

    if (!existingTransaction) {
      throw new Error("Transaction not found");
    }

    await this.transactionRepository.delete(id);
  }
}
