import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client";
import { ENVIRONMENT_CONFIG } from "@config";

let prisma: PrismaClient;

export function createPrismaClient(): PrismaClient {
  if (!prisma) {
    const connectionString = ENVIRONMENT_CONFIG.DATABASE_URL;

    const pgAdapter = new PrismaPg({
      connectionString,
    });
    prisma = new PrismaClient({ adapter: pgAdapter });
  }
  return prisma;
}
