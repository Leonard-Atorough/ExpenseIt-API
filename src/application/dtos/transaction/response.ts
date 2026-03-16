export interface TransactionResponseDto {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string;
  date: Date;
}

export type UpdateTransactionResponseDto = TransactionResponseDto;
