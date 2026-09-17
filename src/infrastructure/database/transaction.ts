import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

/** Retry whole transactions only when PostgreSQL guarantees they rolled back. */
export async function serializableTransaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2034" || attempt >= 3) throw error;
    }
  }
}

/** Stable lock order also serializes reciprocal social actions. */
export async function lockUserPair(tx: Prisma.TransactionClient, first: string, second: string) {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id IN (${Prisma.join([first, second].sort())}) ORDER BY id FOR UPDATE`;
}
