export interface CreateTransactionDto {
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string;
  transactionDate: Date;
}

export interface UpdateTransactionDto {
  amount?: number;
  type?: "income" | "expense";
  category?: string;
  description?: string;
  transactionDate?: Date;
}
