import "dotenv/config";
import { PrismaClient } from "../../generated/prisma/client.ts";

let prisma;

export function initDb() {
  try {
    if (prisma) return prisma;
    prisma = new PrismaClient();
    console.log("Prisma client initialized.");
    return prisma;
  } catch (error) {
    console.error(`Failed to initialize Prisma client.`, error);
  }
}
