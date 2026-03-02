import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client";

let prisma: PrismaClient;

export function createPrismaClient(): PrismaClient {
  if (!prisma) {
    const connectionString = process.env.DATABASE_URL || "";

    const pgAdapter = new PrismaPg({
      connectionString,
    });
    prisma = new PrismaClient({ adapter: pgAdapter });
  }
  return prisma;
}
