import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import { applyWalletTransaction, WalletError } from "@/modules/economy/service";
import { recordAnalyticsEvent } from "@/modules/analytics/service";
import { createNotification } from "@/modules/notifications/service";
import {
  COSMETIC_PRESETS,
  isCosmeticRarity,
  isCosmeticType,
  isPresetForType,
  isVisualPreset,
  type CosmeticRarityKey,
  type CosmeticTypeKey,
  type CosmeticVisualPresetKey,
} from "@/modules/cosmetics/visuals";

type TransactionClient = Prisma.TransactionClient;
type DatabaseClient = TransactionClient | typeof prisma;

export const MAX_COSMETIC_PRICE = 100_000;

export class CosmeticError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function activePremiumWhere(now = new Date()) {
  return {
    tier: "PREMIUM" as const,
    startsAt: { lte: now },
    revokedAt: null,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}

export function isEntitlementActive(
  entitlement: { startsAt: Date; expiresAt: Date | null; revokedAt: Date | null },
  now = new Date(),
) {
  return !entitlement.revokedAt && entitlement.startsAt <= now && (!entitlement.expiresAt || entitlement.expiresAt > now);
}

export async function hasActivePremiumEntitlement(userId: string, client: DatabaseClient = prisma, now = new Date()) {
  return Boolean(
    await client.premiumEntitlement.findFirst({
      where: { userId, ...activePremiumWhere(now) },
      select: { id: true },
    }),
  );
}

function normalizeText(value: unknown, field: string, maxLength: number) {
  if (typeof value !== "string") throw new CosmeticError(`${field} es obligatorio`);
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new CosmeticError(`${field} debe tener entre 1 y ${maxLength} caracteres`);
  }
  return normalized;
}

function normalizeSlug(value: unknown) {
  const slug = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+){0,7}$/.test(slug)) {
    throw new CosmeticError("El slug debe usar minúsculas, números y guiones");
  }
  return slug;
}

function normalizePrice(value: unknown) {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > MAX_COSMETIC_PRICE) {
    throw new CosmeticError(`El precio debe ser un entero entre 0 y ${MAX_COSMETIC_PRICE.toLocaleString("en-US")}`);
  }
  return value as number;
}

function normalizeType(value: unknown): CosmeticTypeKey {
  if (!isCosmeticType(value)) throw new CosmeticError("Tipo de cosmético inválido");
  return value;
}

function normalizeRarity(value: unknown): CosmeticRarityKey {
  if (!isCosmeticRarity(value)) throw new CosmeticError("Rareza inválida");
  return value;
}

function normalizeVisualPreset(type: CosmeticTypeKey, value: unknown): CosmeticVisualPresetKey {
  if (!isVisualPreset(value) || !isPresetForType(type, value)) {
    throw new CosmeticError("El preset visual no corresponde al tipo de cosmético");
  }
  return value;
}

export interface CosmeticInput {
  slug: string;
  type: CosmeticTypeKey;
  rarity: CosmeticRarityKey;
  name: string;
  description: string;
  nameEn: string;
  descriptionEn: string;
  price: number;
  premiumOnly: boolean;
  active: boolean;
  visualPreset: CosmeticVisualPresetKey;
}

export function normalizeCosmeticInput(input: Partial<CosmeticInput>, existing?: CosmeticInput): CosmeticInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new CosmeticError("Datos de cosmético inválidos");
  if (!existing && ["slug", "type", "rarity", "name", "description", "nameEn", "descriptionEn", "price", "visualPreset"].some((key) => !(key in input))) throw new CosmeticError("Completá todos los campos del cosmético");
  for (const field of ["premiumOnly", "active"] as const) {
    if (input[field] !== undefined && typeof input[field] !== "boolean") throw new CosmeticError("Estado de cosmético inválido");
  }
  const type = input.type === undefined ? existing?.type : normalizeType(input.type);
  if (!type) throw new CosmeticError("Tipo de cosmético inválido");
  return {
    slug: input.slug === undefined ? existing!.slug : normalizeSlug(input.slug),
    type,
    rarity: input.rarity === undefined ? existing!.rarity : normalizeRarity(input.rarity),
    name: input.name === undefined ? existing!.name : normalizeText(input.name, "El nombre en español", 80),
    description: input.description === undefined ? existing!.description : normalizeText(input.description, "La descripción en español", 300),
    nameEn: input.nameEn === undefined ? existing!.nameEn : normalizeText(input.nameEn, "English name", 80),
    descriptionEn: input.descriptionEn === undefined ? existing!.descriptionEn : normalizeText(input.descriptionEn, "English description", 300),
    price: input.price === undefined ? existing!.price : normalizePrice(input.price),
    premiumOnly: input.premiumOnly === undefined ? (existing?.premiumOnly ?? false) : Boolean(input.premiumOnly),
    active: input.active === undefined ? (existing?.active ?? true) : Boolean(input.active),
    visualPreset: input.visualPreset === undefined
      ? normalizeVisualPreset(type, existing!.visualPreset)
      : normalizeVisualPreset(type, input.visualPreset),
  };
}

async function serializable<T>(operation: (tx: TransactionClient) => Promise<T>) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      lastError = error;
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2034") throw error;
    }
  }
  throw lastError;
}

function publicCosmetic(cosmetic: {
  id: string; slug: string; type: CosmeticTypeKey; rarity: CosmeticRarityKey; name: string; description: string;
  nameEn: string; descriptionEn: string; price: number; premiumOnly: boolean; active: boolean; visualPreset: CosmeticVisualPresetKey;
}) {
  return cosmetic;
}

export async function listCosmeticsForAccount(userId?: string) {
  const now = new Date();
  const [catalog, wallet, inventory, equipped, premium] = await Promise.all([
    prisma.cosmetic.findMany({ where: { active: true }, orderBy: [{ type: "asc" }, { price: "asc" }, { createdAt: "asc" }] }),
    userId ? prisma.wallet.findUnique({ where: { userId }, select: { balance: true } }) : null,
    userId ? prisma.userCosmetic.findMany({ where: { userId }, include: { cosmetic: true }, orderBy: { acquiredAt: "desc" } }) : [],
    userId ? prisma.equippedCosmetic.findMany({ where: { userId }, select: { type: true, cosmeticId: true } }) : [],
    userId ? hasActivePremiumEntitlement(userId, prisma, now) : false,
  ]);
  const ownedIds = new Set(inventory.map((entry) => entry.cosmeticId));
  const equippedByType = new Map(equipped.map((entry) => [entry.type, entry.cosmeticId]));
  const status = (cosmetic: (typeof catalog)[number]) => ({
    ...publicCosmetic(cosmetic),
    owned: ownedIds.has(cosmetic.id),
    equipped: equippedByType.get(cosmetic.type) === cosmetic.id,
  });

  return {
    balance: wallet?.balance ?? 0,
    premium,
    catalog: catalog.map(status),
    inventory: inventory.map((entry) => ({
      ...publicCosmetic(entry.cosmetic),
      owned: true,
      equipped: equippedByType.get(entry.cosmetic.type) === entry.cosmeticId,
      acquiredAt: entry.acquiredAt.toISOString(),
    })),
  };
}

export async function listPublicCosmetics() {
  const cosmetics = await prisma.cosmetic.findMany({
    where: { active: true },
    orderBy: [{ type: "asc" }, { price: "asc" }, { createdAt: "asc" }],
  });
  return cosmetics.map((cosmetic) => ({ ...publicCosmetic(cosmetic), owned: false, equipped: false }));
}

export async function purchaseCosmetic(userId: string, cosmeticId: string) {
  if (!cosmeticId.trim()) throw new CosmeticError("Cosmético inválido");
  try {
    return await serializable(async (tx) => {
      const cosmetic = await tx.cosmetic.findUnique({ where: { id: cosmeticId } });
      if (!cosmetic || !cosmetic.active) throw new CosmeticError("Este cosmético no está disponible", 404);

      const existing = await tx.userCosmetic.findUnique({ where: { userId_cosmeticId: { userId, cosmeticId } } });
      if (existing) {
        const wallet = await tx.wallet.findUnique({ where: { userId }, select: { balance: true } });
        return { alreadyOwned: true, balance: wallet?.balance ?? 0, cosmetic: publicCosmetic(cosmetic) };
      }
      if (cosmetic.premiumOnly && !(await hasActivePremiumEntitlement(userId, tx))) {
        throw new CosmeticError("Este cosmético requiere Premium", 403);
      }

      const walletMutation = cosmetic.price === 0
        ? { applied: true, balance: (await tx.wallet.findUnique({ where: { userId }, select: { balance: true } }))?.balance ?? 0 }
        : await applyWalletTransaction(tx, {
        userId,
        type: "SPEND",
        source: "COSMETIC_PURCHASE",
        amount: -cosmetic.price,
        sourceKey: `cosmetic-purchase:${userId}:${cosmetic.id}`,
        description: `Cosmético · ${cosmetic.name}`,
      });
      await tx.userCosmetic.upsert({
        where: { userId_cosmeticId: { userId, cosmeticId } },
        create: { userId, cosmeticId, source: "PURCHASE" },
        update: {},
      });
      return { alreadyOwned: !walletMutation.applied, balance: walletMutation.balance, cosmetic: publicCosmetic(cosmetic) };
    });
  } catch (error) {
    if (error instanceof WalletError) throw new CosmeticError(error.message, error.status);
    throw error;
  }
}

export async function equipCosmetic(userId: string, cosmeticId: string) {
  if (!cosmeticId.trim()) throw new CosmeticError("Cosmético inválido");
  const result = await serializable(async (tx) => {
    const ownership = await tx.userCosmetic.findUnique({
      where: { userId_cosmeticId: { userId, cosmeticId } },
      include: { cosmetic: true },
    });
    if (!ownership) throw new CosmeticError("No tenés este cosmético", 403);
    if (ownership.cosmetic.premiumOnly && !(await hasActivePremiumEntitlement(userId, tx))) {
      throw new CosmeticError("Este cosmético requiere Premium activo", 403);
    }
    const equipped = await tx.equippedCosmetic.upsert({
      where: { userId_type: { userId, type: ownership.cosmetic.type } },
      create: { userId, type: ownership.cosmetic.type, cosmeticId },
      update: { cosmeticId },
    });
    return { equipped, cosmetic: publicCosmetic(ownership.cosmetic) };
  });
  await recordAnalyticsEvent({
    type: "COSMETIC_EQUIPPED",
    userId,
    sourceKey: `cosmetic-equip:${userId}:${result.equipped.type}:${result.equipped.cosmeticId}:${result.equipped.updatedAt.toISOString()}`,
    metadata: { cosmeticType: result.equipped.type },
  });
  return result;
}

export async function unequipCosmetic(userId: string, type: unknown) {
  if (!isCosmeticType(type)) throw new CosmeticError("Tipo de cosmético inválido");
  await prisma.equippedCosmetic.deleteMany({ where: { userId, type } });
  return { type };
}

export async function listAllCosmetics() {
  return prisma.cosmetic.findMany({
    include: { _count: { select: { owners: true } } },
    orderBy: [{ active: "desc" }, { type: "asc" }, { createdAt: "asc" }],
  });
}

export async function createCosmetic(actorId: string, rawInput: Partial<CosmeticInput>) {
  const input = normalizeCosmeticInput(rawInput);
  try {
    return await prisma.$transaction(async (tx) => {
      const cosmetic = await tx.cosmetic.create({ data: input });
      await tx.adminActionLog.create({
        data: { actorId, action: "cosmetic.create", targetType: "Cosmetic", targetId: cosmetic.id, metadata: { slug: cosmetic.slug, type: cosmetic.type } },
      });
      return cosmetic;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new CosmeticError("Ya existe un cosmético con ese slug", 409);
    }
    throw error;
  }
}

export async function updateCosmetic(actorId: string, id: string, rawInput: Partial<CosmeticInput>) {
  const existing = await prisma.cosmetic.findUnique({ where: { id } });
  if (!existing) throw new CosmeticError("Cosmético no encontrado", 404);
  const input = normalizeCosmeticInput(rawInput, existing);
  if (input.type !== existing.type && await prisma.userCosmetic.count({ where: { cosmeticId: id } })) throw new CosmeticError("No se puede cambiar el tipo de un cosmético con propietarios", 409);
  try {
    return await prisma.$transaction(async (tx) => {
      const cosmetic = await tx.cosmetic.update({ where: { id }, data: input });
      await tx.adminActionLog.create({
        data: { actorId, action: "cosmetic.update", targetType: "Cosmetic", targetId: id, metadata: { slug: cosmetic.slug, active: cosmetic.active } },
      });
      return cosmetic;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new CosmeticError("Ya existe un cosmético con ese slug", 409);
    }
    throw error;
  }
}

export async function deleteCosmetic(actorId: string, id: string) {
  const cosmetic = await prisma.cosmetic.findUnique({ where: { id }, include: { _count: { select: { owners: true } } } });
  if (!cosmetic) throw new CosmeticError("Cosmético no encontrado", 404);
  if (cosmetic._count.owners > 0) {
    throw new CosmeticError("No se puede borrar un cosmético con propietarios; desactivalo en su lugar", 409);
  }
  await prisma.$transaction(async (tx) => {
    await tx.cosmetic.delete({ where: { id } });
    await tx.adminActionLog.create({
      data: { actorId, action: "cosmetic.delete", targetType: "Cosmetic", targetId: id, metadata: { slug: cosmetic.slug } },
    });
  });
}

function normalizePremiumReason(value: unknown) {
  return normalizeText(value, "La razón", 500);
}

function normalizeExpiry(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw new CosmeticError("La fecha de expiración es inválida");
  const date = new Date(value);
  if (Number.isNaN(date.valueOf()) || date <= new Date()) throw new CosmeticError("La fecha de expiración debe ser futura");
  return date;
}

export async function searchPremiumUsers(query: string) {
  const value = query.trim();
  const now = new Date();
  const users = await prisma.user.findMany({
    where: value ? { OR: [
      { username: { contains: value, mode: "insensitive" } },
      { displayName: { contains: value, mode: "insensitive" } },
      { name: { contains: value, mode: "insensitive" } },
      { email: { contains: value, mode: "insensitive" } },
    ] } : undefined,
    select: {
      id: true, username: true, displayName: true, name: true, email: true,
      premiumEntitlements: { where: activePremiumWhere(now), select: { id: true }, take: 1 },
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });
  return users.map(({ premiumEntitlements, ...user }) => ({ ...user, premium: premiumEntitlements.length > 0 }));
}

export async function getAdminPremiumSummary(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, username: true, displayName: true, name: true, email: true,
      premiumEntitlements: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!user) throw new CosmeticError("Usuario no encontrado", 404);
  const now = new Date();
  return { ...user, premium: user.premiumEntitlements.some((entitlement) => isEntitlementActive(entitlement, now)) };
}

export async function getUserPremiumStatus(userId: string) {
  const entitlement = await prisma.premiumEntitlement.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { tier: true, startsAt: true, expiresAt: true, revokedAt: true, source: true, createdAt: true },
  });
  if (!entitlement) return { active: false as const };
  const now = new Date();
  return {
    active: isEntitlementActive(entitlement, now),
    tier: entitlement.tier,
    grantedAt: entitlement.startsAt.toISOString(),
    expiresAt: entitlement.expiresAt?.toISOString() ?? null,
    source: entitlement.source,
  };
}

export async function grantPremium(actorId: string, userId: string, raw: { reason: unknown; expiresAt: unknown }) {
  const reason = normalizePremiumReason(raw.reason);
  const expiresAt = normalizeExpiry(raw.expiresAt);
  return serializable(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new CosmeticError("Usuario no encontrado", 404);
    const existing = await tx.premiumEntitlement.findFirst({ where: { userId, ...activePremiumWhere() } });
    if (existing) return { entitlement: existing, alreadyActive: true };
    const entitlement = await tx.premiumEntitlement.create({ data: { userId, tier: "PREMIUM", expiresAt, source: "ADMIN", reason } });
    await tx.adminActionLog.create({
      data: { actorId, action: "premium.grant", targetType: "User", targetId: userId, metadata: { entitlementId: entitlement.id, expiresAt: expiresAt?.toISOString() ?? null, reason } },
    });
    await createNotification({ userId, type: "PREMIUM", entityType: "PremiumEntitlement", entityId: entitlement.id }, tx);
    return { entitlement, alreadyActive: false };
  });
}

export async function revokePremium(actorId: string, userId: string, entitlementId: string, rawReason: unknown) {
  const reason = normalizePremiumReason(rawReason);
  return serializable(async (tx) => {
    const entitlement = await tx.premiumEntitlement.findFirst({ where: { id: entitlementId, userId } });
    if (!entitlement) throw new CosmeticError("Entitlement Premium no encontrado", 404);
    if (entitlement.revokedAt) return entitlement;
    const revoked = await tx.premiumEntitlement.update({ where: { id: entitlementId }, data: { revokedAt: new Date() } });
    await tx.adminActionLog.create({
      data: { actorId, action: "premium.revoke", targetType: "User", targetId: userId, metadata: { entitlementId, reason } },
    });
    await createNotification({ userId, type: "PREMIUM", entityType: "PremiumEntitlement", entityId: entitlementId }, tx);
    return revoked;
  });
}

export function presetsForType(type: CosmeticTypeKey) {
  return Object.entries(COSMETIC_PRESETS)
    .filter(([, preset]) => preset.type === type)
    .map(([key]) => key as CosmeticVisualPresetKey);
}
