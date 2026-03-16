import type { Request, Response, NextFunction } from "express";
import type { TransactionService } from "src/application/services";
import type {
  ApiResponse,
  CreateTransactionDto,
  TransactionResponseDto,
} from "src/application/dtos";
import { NotFoundError, UnauthorizedError, UnknownError } from "@src/application/errors";

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

      const response: ApiResponse<TransactionResponseDto[]> = {
        ok: true,
        code: 200,
        message: "Transactions fetched successfully",
        data: transactions ,
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

      if (result.id) {
        // Set Location header to the URL of the newly created transaction so the client can easily access it and follow RESTful conventions
        res.setHeader("Location", `/transactions/${result.id}`);
      }
      res.status(201).json(response);
    } catch (err) {
      next(err instanceof Error ? err : new Error("Unknown error"));
    }
  }

  async updateTransaction(req: Request, res: Response, next: NextFunction) {
    // Implementation for updating a transaction will go here
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedError();
    }

    try {
      const transactionId = req.params.transactionId;
      const transactionData = req.body as Partial<CreateTransactionDto>;

      const result = await this.transactionService.updateTransaction(
        transactionId,
        transactionData,
        userId,
      );

      const response: ApiResponse<{ transaction: TransactionResponseDto }> = {
        ok: true,
        code: 200,
        message: "Transaction updated successfully",
        data: { transaction: result },
      };

      res.status(200).json(response);
    } catch (err) {
      next(err instanceof Error ? err : new UnknownError());
    }
  }

  async deleteTransaction(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedError();
    }

    try {
      const transactionId = req.params.transactionId;
      await this.transactionService.deleteTransaction(transactionId, userId);

      const response: ApiResponse<null> = {
        ok: true,
        code: 200,
        message: "Transaction deleted successfully",
        data: null,
      };

      res.status(200).json(response);
    } catch (err) {
      next(err instanceof Error ? err : new UnknownError());
    }
  }
}
