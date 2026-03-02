export interface TransactionResponseDto {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string;
  transactionDate: Date;
}

export type UpdateTransactionResponseDto = TransactionResponseDto;
