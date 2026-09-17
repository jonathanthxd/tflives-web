import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildDatabaseUrl(): string {
  const base = process.env.DATABASE_URL ?? "";
  const url = new URL(base);
  // Neon free tier = 5 connections.  Keep headroom for Better Auth and
  // concurrent serverless invocations.
  if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "3");
  if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "20");
  return url.toString();
}

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: buildDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;