import { z } from "zod";

export const CreateTransactionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["income", "expense"], { message: 'Type must be either "income" or "expense"' }),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  transactionDate: z.date(),
});

export const UpdateTransactionSchema = z.object({
  amount: z.number().positive().optional(),
  type: z.enum(["income", "expense"]).optional(),
  category: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  transactionDate: z.date().optional(),
});

// Inferred types for use throughout the app
export type CreateTransactionDto = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionDto = z.infer<typeof UpdateTransactionSchema>;
