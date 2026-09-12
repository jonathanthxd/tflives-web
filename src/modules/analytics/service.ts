import { createHash } from "node:crypto";
import { Prisma, type AnalyticsEventType, type ApplicationErrorStatus } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";

export const ANALYTICS_RANGES = ["7d", "30d", "90d"] as const;
export type AnalyticsRangeKey = (typeof ANALYTICS_RANGES)[number];

const DAY_MS = 24 * 60 * 60 * 1000;
const RAW_EVENT_RETENTION_DAYS = 90;
const RESOLVED_ERROR_RETENTION_DAYS = 365;

/** Events are intentionally limited to signals without a durable source table. */
export const ANALYTICS_EVENT_TYPES = [
  "PROFILE_COMPLETED",
  "COSMETIC_EQUIPPED",
] as const satisfies readonly AnalyticsEventType[];

const SIGNIFICANT_EVENT_TYPES = new Set<AnalyticsEventType>(ANALYTICS_EVENT_TYPES);

export function isAnalyticsRange(value: string | null | undefined): value is AnalyticsRangeKey {
  return typeof value === "string" && (ANALYTICS_RANGES as readonly string[]).includes(value);
}

export function analyticsRange(value: string | null | undefined, now = new Date()) {
  const key: AnalyticsRangeKey = isAnalyticsRange(value) ? value : "30d";
  const days = Number.parseInt(key, 10);
  const end = now;
  const start = new Date(end.getTime() - days * DAY_MS);
  const previousStart = new Date(start.getTime() - days * DAY_MS);
  return { key, days, start, end, previousStart, previousEnd: start };
}

export function comparison(current: number, previous: number) {
  return {
    value: current,
    previous,
    delta: current - previous,
    percent: previous === 0 ? null : Math.round(((current - previous) / previous) * 100),
  };
}

export function isSignificantAnalyticsEvent(type: AnalyticsEventType) {
  return SIGNIFICANT_EVENT_TYPES.has(type);
}

export type AnalyticsEventInput = {
  type: AnalyticsEventType;
  userId?: string | null;
  sourceKey?: string;
  /** Code-owned values only: no request data, text, URLs, or identifiers. */
  metadata?: { cosmeticType?: string };
};

/**
 * A best-effort event writer. Analytics must never invalidate a completed
 * product action; idempotency uses the same source identity as that action.
 */
export async function recordAnalyticsEvent(input: AnalyticsEventInput) {
  if (!ANALYTICS_EVENT_TYPES.includes(input.type)) return false;
  const sourceKey = input.sourceKey?.trim() || null;
  try {
    await prisma.analyticsEvent.create({
      data: {
        type: input.type,
        userId: input.userId ?? null,
        sourceKey,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
    });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && sourceKey) return false;
    console.error("[analytics] Unable to persist an analytics event.");
    return false;
  }
}

export function sanitizeApplicationErrorMessage(value: string) {
  return value
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\b(?:bearer|token|secret|password)\s*[:=]\s*[^\s,;]+/gi, "[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240) || "Unexpected application error";
}

export function applicationErrorFingerprint(area: string, error: unknown) {
  const errorName = error instanceof Error ? error.name : "UnknownError";
  const errorCode = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : "";
  const message = sanitizeApplicationErrorMessage(error instanceof Error ? error.message : String(error));
  return createHash("sha256").update(`${area}:${errorName}:${errorCode}:${message}`).digest("hex").slice(0, 32);
}

/** Persists a compact aggregate safely; it intentionally does not rethrow. */
export async function captureApplicationError({
  area,
  error,
  status,
}: {
  area: string;
  error: unknown;
  status?: number;
}) {
  const safeArea = area.replace(/[^a-z0-9:_-]/gi, "").slice(0, 80) || "application";
  const message = sanitizeApplicationErrorMessage(error instanceof Error ? error.message : String(error));
  const fingerprint = applicationErrorFingerprint(safeArea, error);
  const now = new Date();
  try {
    await prisma.applicationError.upsert({
      where: { fingerprint },
      create: {
        fingerprint,
        area: safeArea,
        message,
        count: 1,
        lastStatus: status,
      },
      update: {
        count: { increment: 1 },
        lastSeenAt: now,
        lastStatus: status,
        status: "OPEN",
        resolvedAt: null,
      },
    });
  } catch {
    console.error("[analytics] Unable to persist an application error.");
  }
}

export async function updateApplicationErrorStatus(id: string, status: ApplicationErrorStatus) {
  const now = new Date();
  return prisma.applicationError.update({
    where: { id },
    data: { status, resolvedAt: status === "OPEN" ? null : now },
    select: {
      id: true,
      area: true,
      message: true,
      count: true,
      status: true,
      firstSeenAt: true,
      lastSeenAt: true,
      lastStatus: true,
    },
  });
}

/** Safe to invoke from a protected maintenance action when cron is unavailable. */
export async function purgeExpiredAnalyticsData(now = new Date()) {
  const rawBefore = new Date(now.getTime() - RAW_EVENT_RETENTION_DAYS * DAY_MS);
  const resolvedBefore = new Date(now.getTime() - RESOLVED_ERROR_RETENTION_DAYS * DAY_MS);
  const [events, errors] = await Promise.all([
    prisma.analyticsEvent.deleteMany({ where: { createdAt: { lt: rawBefore } } }),
    prisma.applicationError.deleteMany({
      where: { status: { in: ["RESOLVED", "IGNORED"] }, lastSeenAt: { lt: resolvedBefore } },
    }),
  ]);
  return { events: events.count, errors: errors.count };
}

type Period = { start: Date; end: Date };

function periodWhere(period: Period) {
  return { gte: period.start, lt: period.end };
}

async function compareCount(count: (period: Period) => Promise<number>, current: Period, previous: Period) {
  const [currentValue, previousValue] = await Promise.all([count(current), count(previous)]);
  return comparison(currentValue, previousValue);
}

async function activeUserIds(period: Period) {
  const createdAt = periodWhere(period);
  const [globalMessages, directMessages, follows, reactions, friendships, progress, cosmetics, creatorApplications, events] = await Promise.all([
    prisma.globalChatMessage.findMany({ where: { createdAt }, select: { authorId: true } }),
    prisma.directMessage.findMany({ where: { createdAt }, select: { senderId: true } }),
    prisma.follow.findMany({ where: { createdAt }, select: { followerId: true } }),
    prisma.reaction.findMany({ where: { createdAt }, select: { userId: true } }),
    prisma.friendship.findMany({ where: { status: "ACCEPTED", respondedAt: createdAt }, select: { requesterId: true, addresseeId: true } }),
    prisma.progressEvent.findMany({ where: { createdAt }, select: { userId: true } }),
    prisma.userCosmetic.findMany({ where: { acquiredAt: createdAt }, select: { userId: true } }),
    prisma.creatorApplication.findMany({ where: { createdAt }, select: { userId: true } }),
    prisma.analyticsEvent.findMany({ where: { createdAt, type: { in: [...SIGNIFICANT_EVENT_TYPES] }, userId: { not: null } }, select: { userId: true } }),
  ]);
  return new Set([
    ...globalMessages.map((row) => row.authorId),
    ...directMessages.map((row) => row.senderId),
    ...follows.map((row) => row.followerId),
    ...reactions.map((row) => row.userId),
    ...friendships.flatMap((row) => [row.requesterId, row.addresseeId]),
    ...progress.map((row) => row.userId),
    ...cosmetics.map((row) => row.userId),
    ...creatorApplications.map((row) => row.userId),
    ...events.flatMap((row) => row.userId ? [row.userId] : []),
  ]);
}

async function socialUserIds(period: Period) {
  const createdAt = periodWhere(period);
  const [globalMessages, directMessages, follows, reactions, friendships] = await Promise.all([
    prisma.globalChatMessage.findMany({ where: { createdAt }, select: { authorId: true } }),
    prisma.directMessage.findMany({ where: { createdAt }, select: { senderId: true } }),
    prisma.follow.findMany({ where: { createdAt }, select: { followerId: true } }),
    prisma.reaction.findMany({ where: { createdAt }, select: { userId: true } }),
    prisma.friendship.findMany({ where: { status: "ACCEPTED", respondedAt: createdAt }, select: { requesterId: true, addresseeId: true } }),
  ]);
  return new Set([
    ...globalMessages.map((row) => row.authorId),
    ...directMessages.map((row) => row.senderId),
    ...follows.map((row) => row.followerId),
    ...reactions.map((row) => row.userId),
    ...friendships.flatMap((row) => [row.requesterId, row.addresseeId]),
  ]);
}

async function coinTotals(period: Period) {
  const createdAt = periodWhere(period);
  const [credits, debits] = await Promise.all([
    prisma.walletTransaction.aggregate({ where: { createdAt, amount: { gt: 0 } }, _sum: { amount: true } }),
    prisma.walletTransaction.aggregate({ where: { createdAt, amount: { lt: 0 } }, _sum: { amount: true } }),
  ]);
  return { emitted: credits._sum.amount ?? 0, spent: Math.abs(debits._sum.amount ?? 0) };
}

async function analyticsMetricSet(current: Period, previous: Period) {
  const count = (query: (period: Period) => Promise<number>) => compareCount(query, current, previous);

  const [newUsers, messages, directMessages, follows, likes, levelUps, profileAchievements, awardedAchievements, profileCompleted, cosmeticPurchases, cosmeticEquips, creatorApplications, creatorApprovals, reports, currentCoins, previousCoins] = await Promise.all([
    count((period) => prisma.user.count({ where: { createdAt: periodWhere(period) } })),
    count((period) => prisma.globalChatMessage.count({ where: { createdAt: periodWhere(period) } })),
    count((period) => prisma.directMessage.count({ where: { createdAt: periodWhere(period) } })),
    count((period) => prisma.follow.count({ where: { createdAt: periodWhere(period) } })),
    count((period) => prisma.reaction.count({ where: { createdAt: periodWhere(period) } })),
    count((period) => prisma.walletTransaction.count({ where: { type: "LEVEL_REWARD", createdAt: periodWhere(period) } })),
    count((period) => prisma.userProgressAchievement.count({ where: { unlockedAt: periodWhere(period) } })),
    count((period) => prisma.userAchievement.count({ where: { awardedAt: periodWhere(period) } })),
    count((period) => prisma.analyticsEvent.count({ where: { type: "PROFILE_COMPLETED", createdAt: periodWhere(period) } })),
    count((period) => prisma.userCosmetic.count({ where: { source: "PURCHASE", acquiredAt: periodWhere(period) } })),
    count((period) => prisma.analyticsEvent.count({ where: { type: "COSMETIC_EQUIPPED", createdAt: periodWhere(period) } })),
    count((period) => prisma.creatorApplication.count({ where: { createdAt: periodWhere(period) } })),
    compareCount((period) => prisma.creatorApplication.count({ where: { status: "APPROVED", reviewedAt: periodWhere(period) } }), current, previous),
    count((period) => prisma.report.count({ where: { createdAt: periodWhere(period) } })),
    coinTotals(current),
    coinTotals(previous),
  ]);

  return {
    newUsers,
    messages,
    directMessages,
    follows,
    likes,
    levelUps,
    achievements: comparison(profileAchievements.value + awardedAchievements.value, profileAchievements.previous + awardedAchievements.previous),
    profileCompleted,
    cosmeticPurchases,
    cosmeticEquips,
    creatorApplications,
    creatorApprovals,
    reports,
    coins: {
      emitted: comparison(currentCoins.emitted, previousCoins.emitted),
      spent: comparison(currentCoins.spent, previousCoins.spent),
    },
  };
}

async function onboardingFunnel(period: Period) {
  const [newUsers, profileEvents, socialUsers] = await Promise.all([
    prisma.user.findMany({ where: { createdAt: periodWhere(period) }, select: { id: true } }),
    prisma.analyticsEvent.findMany({ where: { type: "PROFILE_COMPLETED", createdAt: periodWhere(period), userId: { not: null } }, select: { userId: true } }),
    socialUserIds(period),
  ]);
  const accountIds = new Set(newUsers.map((user) => user.id));
  const completedIds = new Set(profileEvents.flatMap((event) => event.userId ? [event.userId] : []).filter((id) => accountIds.has(id)));
  return {
    accounts: accountIds.size,
    profilesCompleted: completedIds.size,
    socialInteraction: [...completedIds].filter((id) => socialUsers.has(id)).length,
  };
}

export async function getAdminAnalytics(rawRange: string | null | undefined, now = new Date()) {
  const range = analyticsRange(rawRange, now);
  const current = { start: range.start, end: range.end };
  const previous = { start: range.previousStart, end: range.previousEnd };
  const day = { start: new Date(now.getTime() - DAY_MS), end: now };
  const priorDay = { start: new Date(now.getTime() - 2 * DAY_MS), end: day.start };

  const [totalUsers, metrics, selectedActive, priorActive, dau, priorDau, wau, priorWau, mau, priorMau, activeCreators, featuredCreators, activeCosmetics, topPurchases, openReports, errorsLast24h, openErrors, lastError, lastEvent, funnel, totalCoinBalance, dayMessages, dayDms, dayFollows, dayLikes, dayEvents] = await Promise.all([
    prisma.user.count(),
    analyticsMetricSet(current, previous),
    activeUserIds(current),
    activeUserIds(previous),
    activeUserIds(day),
    activeUserIds(priorDay),
    activeUserIds({ start: new Date(now.getTime() - 7 * DAY_MS), end: now }),
    activeUserIds({ start: new Date(now.getTime() - 14 * DAY_MS), end: new Date(now.getTime() - 7 * DAY_MS) }),
    activeUserIds({ start: new Date(now.getTime() - 30 * DAY_MS), end: now }),
    activeUserIds({ start: new Date(now.getTime() - 60 * DAY_MS), end: new Date(now.getTime() - 30 * DAY_MS) }),
    prisma.creatorProfile.count({ where: { status: "ACTIVE" } }),
    prisma.creatorProfile.count({ where: { status: "ACTIVE", featured: true } }),
    prisma.cosmetic.count({ where: { active: true } }),
    prisma.userCosmetic.groupBy({ by: ["cosmeticId"], where: { source: "PURCHASE", acquiredAt: periodWhere(current) }, _count: { cosmeticId: true }, orderBy: { _count: { cosmeticId: "desc" } }, take: 5 }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.applicationError.count({ where: { lastSeenAt: { gte: day.start } } }),
    prisma.applicationError.count({ where: { status: "OPEN" } }),
    prisma.applicationError.findFirst({ orderBy: { lastSeenAt: "desc" }, select: { area: true, message: true, lastSeenAt: true, lastStatus: true } }),
    prisma.analyticsEvent.findFirst({ orderBy: { createdAt: "desc" }, select: { type: true, createdAt: true } }),
    onboardingFunnel(current),
    prisma.wallet.aggregate({ _sum: { balance: true } }),
    prisma.globalChatMessage.count({ where: { createdAt: periodWhere(day) } }),
    prisma.directMessage.count({ where: { createdAt: periodWhere(day) } }),
    prisma.follow.count({ where: { createdAt: periodWhere(day) } }),
    prisma.reaction.count({ where: { createdAt: periodWhere(day) } }),
    prisma.analyticsEvent.count({ where: { createdAt: periodWhere(day) } }),
  ]);
  const topIds = topPurchases.map((row) => row.cosmeticId);
  const cosmetics = topIds.length ? await prisma.cosmetic.findMany({ where: { id: { in: topIds } }, select: { id: true, name: true, nameEn: true } }) : [];
  const cosmeticsById = new Map(cosmetics.map((cosmetic) => [cosmetic.id, cosmetic]));

  return {
    range: { key: range.key, days: range.days, start: range.start, end: range.end },
    users: {
      total: totalUsers,
      active: comparison(selectedActive.size, priorActive.size),
      dau: comparison(dau.size, priorDau.size),
      wau: comparison(wau.size, priorWau.size),
      mau: comparison(mau.size, priorMau.size),
      new: metrics.newUsers,
    },
    community: {
      messages: metrics.messages,
      directMessages: metrics.directMessages,
      follows: metrics.follows,
      likes: metrics.likes,
    },
    progression: { levelUps: metrics.levelUps, achievements: metrics.achievements, profileCompleted: metrics.profileCompleted },
    economy: { ...metrics.coins, circulating: totalCoinBalance._sum.balance ?? 0 },
    cosmetics: {
      purchases: metrics.cosmeticPurchases,
      equips: metrics.cosmeticEquips,
      active: activeCosmetics,
      top: topPurchases.map((row) => ({
        id: row.cosmeticId,
        name: cosmeticsById.get(row.cosmeticId)?.name ?? "—",
        nameEn: cosmeticsById.get(row.cosmeticId)?.nameEn ?? "—",
        purchases: row._count.cosmeticId,
      })),
    },
    creators: { applications: metrics.creatorApplications, approvals: metrics.creatorApprovals, active: activeCreators, featured: featuredCreators },
    moderation: { reports: metrics.reports, openReports },
    funnels: { onboarding: funnel },
    health: {
      errorsLast24h,
      openErrors,
      lastError: lastError ? { ...lastError, lastSeenAt: lastError.lastSeenAt.toISOString() } : null,
      lastEvent: lastEvent ? { ...lastEvent, createdAt: lastEvent.createdAt.toISOString() } : null,
      significantEventsLast24h: dayMessages + dayDms + dayFollows + dayLikes + dayEvents,
    },
  };
}

export async function listApplicationErrors(limit = 12) {
  return prisma.applicationError.findMany({
    orderBy: [{ status: "asc" }, { lastSeenAt: "desc" }],
    take: Math.min(Math.max(limit, 1), 30),
    select: { id: true, area: true, message: true, count: true, status: true, firstSeenAt: true, lastSeenAt: true, lastStatus: true },
  });
}

/** Small, permission-gated dashboard preview; the detailed data stays in analytics. */
export async function getAdminAnalyticsQuickSummary(now = new Date()) {
  const day = { start: new Date(now.getTime() - DAY_MS), end: now };
  const week = { start: new Date(now.getTime() - 7 * DAY_MS), end: now };
  const [activeUsers, errorsLast24h, messages, directMessages, follows, likes, events] = await Promise.all([
    activeUserIds(week),
    prisma.applicationError.count({ where: { lastSeenAt: { gte: day.start } } }),
    prisma.globalChatMessage.count({ where: { createdAt: periodWhere(day) } }),
    prisma.directMessage.count({ where: { createdAt: periodWhere(day) } }),
    prisma.follow.count({ where: { createdAt: periodWhere(day) } }),
    prisma.reaction.count({ where: { createdAt: periodWhere(day) } }),
    prisma.analyticsEvent.count({ where: { createdAt: periodWhere(day) } }),
  ]);
  return { activeUsers7d: activeUsers.size, errorsLast24h, significantEventsLast24h: messages + directMessages + follows + likes + events };
}
