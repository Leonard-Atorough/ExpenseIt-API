import "dotenv/config";
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

export function initDb(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}
