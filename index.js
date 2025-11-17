import express from "express";
import "dotenv/config";
import { authRouter } from "./src/routes/authRouter.js";
import { initDb } from "./src/config/db.js";
import transactionRoutes from "./src/routes/transactionRouter.js";

const app = express();
const prisma = initDb();

app.use(express.json());

app.use((req, res, next) => {
  req.user = { id: 42 }; // dummy user
  next();
});

app.use("/auth", authRouter);
app.use("/transactions", transactionRoutes(prisma));

const PORT = process.env.PORT || 3000;

app.listen(PORT, (error) => {
  if (error) throw error;

  console.log(`ExpenseIt API running on http://localhost:${PORT}/`);
});
