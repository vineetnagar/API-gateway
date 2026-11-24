import { PrismaClient } from "@prisma/client";

const logQueries = process.env.PRISMA_LOG_QUERIES === "true";

export const prisma = new PrismaClient({
  log: logQueries ? ["query", "warn", "error"] : ["warn", "error"],
});
