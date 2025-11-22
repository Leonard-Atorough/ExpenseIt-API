import { transactionService } from "../services/transactionService.js";

export function transactionController(prisma) {
  const { fetchTransactions, fetchTransactionForId, addTransaction } = transactionService(prisma);

  async function getTransactions(req, res) {
    res.send("Hello from transaction controller");
  }

  async function getTransactionById(req, res, next) {
    const { transactionId } = req.params;
    const id = parseInt(transactionId);
    const userId = req.user.id;

    try {
      const result = await fetchTransactionForId({ id: id, userId: userId });

      if (result.result === "not-found") {
        res.status(404).json({ error: "Transaction not found or access denied" });
      } else {
        res.status(200).json(result.transaction);
      }
    } catch (error) {
      res.status(500).send("Oops! Something went wrong on our end. We'll look into it.");
      next(new Error(error));
    }
  }

  async function createTransaction(req, res) {}

  return { getTransactions, getTransactionById, createTransaction };
}
