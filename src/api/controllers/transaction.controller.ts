import type { Request, Response, NextFunction } from "express";
import type { TransactionService } from "src/application/services";
import type {
  ApiResponse,
  CreateTransactionDto,
  TransactionResponseDto,
} from "src/application/dtos";
import { NotFoundError, UnauthorizedError } from "@src/application/errors";

export class TransactionController {
  transactionService: TransactionService;
  constructor(transactionService: TransactionService) {
    this.transactionService = transactionService;
  }

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedError();
    }

    try {
      const transactions = await this.transactionService.fetchTransactions({ userId });

      const response: ApiResponse<{ transactions: TransactionResponseDto[] }> = {
        ok: true,
        code: 200,
        message: "Transactions fetched successfully",
        data: { transactions },
      };

      return res.status(200).json(response);
    } catch (err) {
      next(err instanceof Error ? err : new Error("Unknown error"));
    }
  }

  async getTransactionById(req: Request, res: Response, next: NextFunction) {
    const { transactionId } = req.params;
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedError();
    }

    try {
      const result = await this.transactionService.fetchTransactionById({
        id: transactionId,
        userId,
      });

      if (!result) {
        throw new NotFoundError("Transaction not found");
      }

      const response: ApiResponse<{ transaction: TransactionResponseDto }> = {
        ok: true,
        code: 200,
        message: "Transaction fetched successfully",
        data: { transaction: result },
      };
      return res.status(200).json(response);
    } catch (err) {
      next(err instanceof Error ? err : new Error("Unknown error"));
    }
  }

  async createTransaction(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedError();
    }

    const transactionData = req.body as CreateTransactionDto;

    try {
      const result = await this.transactionService.createTransaction(transactionData, userId);

      const response: ApiResponse<{ transaction: TransactionResponseDto }> = {
        ok: true,
        code: 201,
        message: "Transaction created successfully",
        data: { transaction: result },
      };
      res.status(201);
      if (result.id) {
        // Set Location header to the URL of the newly created transaction so the client can easily access it and follow RESTful conventions
        res.setHeader("Location", `/transactions/${result.id}`);
      }
      res.json(response);
    } catch (err) {
      next(err instanceof Error ? err : new Error("Unknown error"));
    }
  }
}
