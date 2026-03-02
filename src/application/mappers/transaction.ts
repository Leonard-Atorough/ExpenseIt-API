import { Transaction } from "src/core/entities";
import type { TransactionResponseDto, UpdateTransactionDto } from "../dtos";

export class TransactionMapper {
  public static toDomain(raw: any): Transaction {
    return Transaction.create({
      userId: raw.userId,
      amount: raw.amount,
      type: raw.type,
      category: raw.category,
      description: raw.description,
      date: raw.date,
    });
  }

  public static toDomainFromPersistence(raw: any): Transaction {
    return Transaction.fromStorage({
      id: raw.id,
      userId: raw.userId,
      amount: raw.amount,
      type: raw.type,
      category: raw.category,
      description: raw.description,
      date: raw.date,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  public static toPersistence(domain: Transaction): any {
    return {
      id: domain.id,
      userId: domain.userId,
      amount: domain.amount,
      type: domain.type,
      category: domain.category,
      description: domain.description,
      date: domain.date,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  public static toDto(domain: Transaction): TransactionResponseDto | UpdateTransactionDto {
    return {
      id: domain.id,
      amount: domain.amount,
      type: domain.type.toString() as "income" | "expense",
      category: domain.category.toString(),
      description: domain.description,
      transactionDate: domain.date,
    };
  }
}
