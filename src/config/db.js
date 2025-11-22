import "dotenv/config";
import { PrismaClient } from "../../generated/prisma/client.ts";

let prisma;

export function initDb() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}
