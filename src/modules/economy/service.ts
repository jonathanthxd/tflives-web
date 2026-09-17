import { serializableTransaction } from "@/infrastructure/database/transaction";
import { randomUUID } from "node:crypto";
import {
  NotificationType,
  type Prisma,
  WalletTransactionSource,
  WalletTransactionType,
} from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";

type WalletTransactionClient = Prisma.TransactionClient;

export const MAX_ADMIN_COIN_ADJUSTMENT = 100_000;
export const MAX_ACHIEVEMENT_COIN_REWARD = 100_000;

const LEVEL_REWARD = 10;
const LEVEL_MILESTONE_BONUSES: Record<number, number> = {
  5: 10,
  10: 20,
  25: 40,
  50: 75,
};

export class WalletError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function levelCoinReward(level: number) {
  const safeLevel = Math.max(1, Math.floor(level));
  return LEVEL_REWARD + (LEVEL_MILESTONE_BONUSES[safeLevel] ?? 0);
}

export function balanceAfterMutation(balance: number, amount: number) {
  if (!Number.isInteger(balance) || balance < 0) throw new WalletError("Saldo de wallet inválido", 500);
  if (!Number.isInteger(amount) || amount === 0) throw new WalletError("El monto debe ser un entero distinto de cero");
  const nextBalance = balance + amount;
  if (nextBalance < 0) throw new WalletError("La wallet no tiene suficientes TFL Coins");
  if (!Number.isSafeInteger(nextBalance) || nextBalance > 2_147_483_647) throw new WalletError("El saldo supera el límite de la wallet", 409);
  return nextBalance;
}

export function validateAdminCoinAdjustment(amount: number, reason: string) {
  const normalizedReason = reason.trim();
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_ADMIN_COIN_ADJUSTMENT) {
    throw new WalletError(`El monto debe ser un entero entre 1 y ${MAX_ADMIN_COIN_ADJUSTMENT.toLocaleString("en-US")}`);
  }
  if (!normalizedReason || normalizedReason.length > 500) {
    throw new WalletError("La razón es obligatoria y debe tener como máximo 500 caracteres");
  }
  return normalizedReason;
}

interface WalletMutationInput {
  userId: string;
  type: WalletTransactionType;
  source: WalletTransactionSource;
  amount: number;
  sourceKey: string;
  description?: string;
}

export interface WalletMutationResult {
  applied: boolean;
  balance: number;
  transaction: {
    id: string;
    type: WalletTransactionType;
    amount: number;
    balanceAfter: number;
    createdAt: Date;
  };
}

/**
 * The only balance-mutating primitive in the application. The wallet upsert
 * takes a row lock before the ledger lookup, making the source key safe for
 * automatic rewards and keeping the cached balance and immutable ledger in
 * the same database transaction.
 */
export async function applyWalletTransaction(
  tx: WalletTransactionClient,
  input: WalletMutationInput,
): Promise<WalletMutationResult> {
  if (!input.userId) throw new WalletError("Usuario de wallet inválido", 500);
  if (!input.sourceKey.trim()) throw new WalletError("Falta la clave de origen", 500);
  if (!Number.isInteger(input.amount) || input.amount === 0) {
    throw new WalletError("El monto debe ser un entero distinto de cero");
  }

  const wallet = await tx.wallet.upsert({
    where: { userId: input.userId },
    create: { userId: input.userId, balance: 0 },
    update: { updatedAt: new Date() },
  });
  const existing = await tx.walletTransaction.findUnique({
    where: { walletId_sourceKey: { walletId: wallet.id, sourceKey: input.sourceKey } },
  });
  if (existing) {
    return {
      applied: false,
      balance: wallet.balance,
      transaction: existing,
    };
  }

  const nextBalance = balanceAfterMutation(wallet.balance, input.amount);
  const transaction = await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: input.type,
      source: input.source,
      amount: input.amount,
      balanceAfter: nextBalance,
      sourceKey: input.sourceKey,
      description: input.description,
    },
  });
  await tx.wallet.update({ where: { id: wallet.id }, data: { balance: nextBalance } });

  return { applied: true, balance: nextBalance, transaction };
}

export function awardLevelCoins(tx: WalletTransactionClient, userId: string, level: number) {
  return applyWalletTransaction(tx, {
    userId,
    type: "LEVEL_REWARD",
    source: "PROGRESSION",
    amount: levelCoinReward(level),
    sourceKey: `level-up:${userId}:${level}`,
  });
}

export function awardAchievementCoins(
  tx: WalletTransactionClient,
  userId: string,
  achievementId: string,
  coinReward: number,
) {
  if (!Number.isInteger(coinReward) || coinReward < 0 || coinReward > MAX_ACHIEVEMENT_COIN_REWARD) {
    throw new WalletError("La recompensa de TFL Coins es inválida", 500);
  }
  if (coinReward === 0) return null;
  return applyWalletTransaction(tx, {
    userId,
    type: "ACHIEVEMENT_REWARD",
    source: "ACHIEVEMENT",
    amount: coinReward,
    sourceKey: `achievement:${userId}:${achievementId}`,
  });
}

async function createWalletNotification(
  tx: WalletTransactionClient,
  userId: string,
  transactionId: string,
) {
  const preference = await tx.notificationPreference.findUnique({
    where: { userId_category: { userId, category: NotificationType.TFL_COINS } },
    select: { inAppEnabled: true },
  });
  if (preference && !preference.inAppEnabled) return null;
  return tx.notification.create({
    data: {
      userId,
      type: "TFL_COINS",
      entityType: "WalletTransaction",
      entityId: transactionId,
    },
  });
}

export async function getWalletSummary(userId: string, limit = 20) {
  const take = Math.min(Math.max(Math.floor(limit) || 20, 1), 50);
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: {
      balance: true,
      transactions: {
        select: { type: true, amount: true, balanceAfter: true, sourceKey: true, description: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take,
      },
    },
  });

  const transactions = wallet?.transactions ?? [];
  const cosmeticPrefix = `cosmetic-purchase:${userId}:`;
  const cosmeticIds = Array.from(new Set(
    transactions
      .map((transaction) => transaction.sourceKey.startsWith(cosmeticPrefix) ? transaction.sourceKey.slice(cosmeticPrefix.length) : null)
      .filter((value): value is string => Boolean(value)),
  ));
  const cosmetics = cosmeticIds.length > 0
    ? await prisma.cosmetic.findMany({
        where: { id: { in: cosmeticIds } },
        select: { id: true, name: true, nameEn: true },
      })
    : [];
  const cosmeticById = new Map(cosmetics.map((cosmetic) => [cosmetic.id, cosmetic]));

  return {
    balance: wallet?.balance ?? 0,
    recentTransactions: transactions.map((transaction) => {
      const cosmeticId = transaction.sourceKey.startsWith(cosmeticPrefix)
        ? transaction.sourceKey.slice(cosmeticPrefix.length)
        : null;
      const cosmetic = cosmeticId ? cosmeticById.get(cosmeticId) : undefined;
      return {
        type: transaction.type,
        amount: transaction.amount,
        balanceAfter: transaction.balanceAfter,
        description: transaction.description,
        cosmetic: cosmetic ? { name: cosmetic.name, nameEn: cosmetic.nameEn } : null,
        createdAt: transaction.createdAt.toISOString(),
      };
    }),
  };
}

export async function searchWalletUsers(query: string) {
  const value = query.trim();
  const users = await prisma.user.findMany({
    where: value
      ? {
          OR: [
            { username: { contains: value, mode: "insensitive" } },
            { displayName: { contains: value, mode: "insensitive" } },
            { name: { contains: value, mode: "insensitive" } },
            { email: { contains: value, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      username: true,
      displayName: true,
      name: true,
      email: true,
      wallet: { select: { balance: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return users.map((user) => ({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    name: user.name,
    email: user.email,
    balance: user.wallet?.balance ?? 0,
  }));
}

export async function getAdminWalletSummary(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      name: true,
      email: true,
      wallet: {
        select: {
          balance: true,
          transactions: {
            select: { id: true, type: true, amount: true, balanceAfter: true, description: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      },
    },
  });
  if (!user) throw new WalletError("Usuario no encontrado", 404);
  return {
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      name: user.name,
      email: user.email,
    },
    balance: user.wallet?.balance ?? 0,
    transactions: (user.wallet?.transactions ?? []).map((transaction) => ({
      ...transaction,
      createdAt: transaction.createdAt.toISOString(),
    })),
  };
}

export async function adjustWalletByAdmin({
  actorId,
  targetUserId,
  amount,
  reason,
  direction,
}: {
  actorId: string;
  targetUserId: string;
  amount: number;
  reason: string;
  direction: "GRANT" | "DEDUCT";
}) {
  const normalizedReason = validateAdminCoinAdjustment(amount, reason);

  const signedAmount = direction === "GRANT" ? amount : -amount;
  return serializableTransaction(async (tx) => {
    const target = await tx.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
    if (!target) throw new WalletError("Usuario no encontrado", 404);

    const result = await applyWalletTransaction(tx, {
      userId: targetUserId,
      type: direction === "GRANT" ? "ADMIN_GRANT" : "ADMIN_DEDUCT",
      source: "ADMIN",
      amount: signedAmount,
      sourceKey: `admin-adjustment:${randomUUID()}`,
      description: normalizedReason,
    });
    await tx.adminActionLog.create({
      data: {
        actorId,
        action: "wallet.adjust",
        targetType: "User",
        targetId: targetUserId,
        metadata: {
          direction,
          amount,
          reason: normalizedReason,
          balanceAfter: result.balance,
        },
      },
    });
    await createWalletNotification(tx, targetUserId, result.transaction.id);
    return result;
  });
}
