import BaseEntity from "../baseEntity";
import { Category } from "./category";
import type { TransactionType } from "./transactionType";

export default class Transaction extends BaseEntity {
  userId: string;
  amount: number;
  type: TransactionType;
  category: Category;
  description: string;
  date: Date;

  private constructor(
    id: string | undefined,
    userId: string,
    amount: number,
    type: TransactionType,
    category: Category,
    description: string,
    transactionDate: Date,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.userId = userId;
    this.amount = amount;
    this.type = type;
    this.category = category;
    this.description = description;
    this.date = transactionDate;
  }

  static create(params: {
    userId: string;
    amount: number;
    type: TransactionType;
    category: Category;
    description: string;
    date: Date;
  }): Transaction {
    const { userId, amount, type, category, description, date } = params;
    return new Transaction(
      undefined,
      userId,
      amount,
      type,
      category,
      description,
      date,
      undefined,
      undefined,
    );
  }

  static fromStorage(params: {
    id: string;
    userId: string;
    amount: number;
    type: TransactionType;
    category: Category;
    description: string;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
  }): Transaction {
    const { id, userId, amount, type, category, description, date, createdAt, updatedAt } = params;
    return new Transaction(
      id,
      userId,
      amount,
      type,
      category,
      description,
      date,
      createdAt,
      updatedAt,
    );
  }

  update(params: {
    amount?: number;
    type?: TransactionType;
    category?: Category;
    description?: string;
    date?: Date;
  }) {
    const { amount, type, category, description, date } = params;
    if (amount !== undefined) this.amount = amount;
    if (type !== undefined) this.type = type;
    if (category !== undefined) this.category = category;
    if (description !== undefined) this.description = description;
    if (date !== undefined) this.date = date;
    this.updatedAt = new Date();
  }

  convertStringToCategory(category: string): Category {
    return new Category(category);
  }
}
