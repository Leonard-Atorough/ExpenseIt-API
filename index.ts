import "dotenv/config";
import { ENVIRONMENT_CONFIG } from "./config";
import { createApp } from "./app";
import { logger } from "@src/api/middleware/index.js";

const app = createApp();

app.listen(ENVIRONMENT_CONFIG.PORT, async (error) => {
  if (error) throw error;
  logger.info(`£££ ExpenseIt API running on http://localhost:${ENVIRONMENT_CONFIG.PORT}/ £££`);
  logger.info(
    `Swagger docs available at http://localhost:${ENVIRONMENT_CONFIG.PORT}/api-docs (not in production)`,
  );
});
