import "dotenv/config";
import { ENVIRONMENT_CONFIG } from "./config";
import { createApp } from "./app";

const app = createApp();

app.listen(ENVIRONMENT_CONFIG.PORT, async (error) => {
  if (error) throw error;
  console.log(`£££ ExpenseIt API running on http://localhost:${ENVIRONMENT_CONFIG.PORT}/ £££`);
});
