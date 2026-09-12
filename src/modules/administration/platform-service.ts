import { Role } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import { listAdminActionLog } from "@/modules/administration/action-log";
import { activePremiumWhere } from "@/modules/cosmetics/service";
import { canAccessSection } from "@/modules/administration/permissions";

const SEARCH_LIMIT = 6;

export class AdminPlatformError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function identityLabel(identity: { displayName: string | null; name: string | null; username: string | null }) {
  return identity.displayName || identity.name || identity.username || "—";
}

function searchWhere(query: string, email = false) {
  return {
    OR: [
      { username: { contains: query, mode: "insensitive" as const } },
      { displayName: { contains: query, mode: "insensitive" as const } },
      { name: { contains: query, mode: "insensitive" as const } },
      ...(email ? [{ email: { contains: query, mode: "insensitive" as const } }] : []),
    ],
  };
}

export function normalizeAdminSearchQuery(rawQuery: string) {
  return rawQuery.trim().slice(0, 80);
}

export async function getAdminDashboardSummary(role: Role) {
  const now = new Date();
  const canSeeCreators = canAccessSection(role, "creators");
  const canSeeProgression = canAccessSection(role, "cosmetics");
  const canSeeAudit = canAccessSection(role, "staffLog");
  const canSeeContent = canAccessSection(role, "posts");

  const [
    users,
    openReports,
    pendingAppeals,
    scheduledPosts,
    scheduledWiki,
    pendingCreators,
    activeCreators,
    activeCosmetics,
    activePremium,
    recentActions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.sanctionAppeal.count({ where: { status: "PENDING" } }),
    canSeeContent ? prisma.post.count({ where: { published: true, archived: false, scheduledFor: { gt: now } } }) : Promise.resolve(null),
    canSeeContent ? prisma.wikiArticle.count({ where: { state: "SCHEDULED", scheduledFor: { gt: now } } }) : Promise.resolve(null),
    canSeeCreators ? prisma.creatorApplication.count({ where: { status: "PENDING" } }) : Promise.resolve(null),
    canSeeCreators ? prisma.creatorProfile.count({ where: { status: "ACTIVE" } }) : Promise.resolve(null),
    canSeeProgression ? prisma.cosmetic.count({ where: { active: true } }) : Promise.resolve(null),
    canSeeProgression ? prisma.premiumEntitlement.count({ where: activePremiumWhere(now) }) : Promise.resolve(null),
    canSeeAudit ? listAdminActionLog(8) : Promise.resolve([]),
  ]);

  const pending = [
    openReports > 0 ? { id: "reports", count: openReports, href: "/admin/reports" } : null,
    pendingAppeals > 0 ? { id: "appeals", count: pendingAppeals, href: "/admin/moderation" } : null,
    pendingCreators && pendingCreators > 0 ? { id: "creators", count: pendingCreators, href: "/admin/creators" } : null,
    scheduledPosts && scheduledPosts > 0 ? { id: "posts", count: scheduledPosts, href: "/admin/posts" } : null,
    scheduledWiki && scheduledWiki > 0 ? { id: "wiki", count: scheduledWiki, href: "/admin/wiki" } : null,
  ].filter((item): item is { id: string; count: number; href: string } => item !== null);

  return {
    counts: { users, openReports, pendingAppeals, scheduledPosts, scheduledWiki, pendingCreators, activeCreators, activeCosmetics, activePremium },
    pending,
    recentActions,
  };
}

export async function searchAdminResources(role: Role, rawQuery: string) {
  const query = normalizeAdminSearchQuery(rawQuery);
  if (query.length < 2) return { query, groups: [] as AdminSearchGroup[] };

  const canManageUsers = canAccessSection(role, "users");
  const canManageCreators = canAccessSection(role, "creators");
  const canManageTeam = canAccessSection(role, "team");
  const canManageAchievements = canAccessSection(role, "achievements");
  const canManageCosmetics = canAccessSection(role, "cosmetics");
  const canManagePosts = canAccessSection(role, "posts");
  const canManageWiki = canAccessSection(role, "wiki");

  const [users, creators, team, achievements, cosmetics, posts, wiki] = await Promise.all([
    canManageUsers
      ? prisma.user.findMany({ where: searchWhere(query, true), select: { id: true, username: true, displayName: true, name: true, email: true }, take: SEARCH_LIMIT, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
    canManageCreators
      ? prisma.creatorProfile.findMany({ where: { user: { is: searchWhere(query) } }, select: { id: true, user: { select: { id: true, username: true, displayName: true, name: true } } }, take: SEARCH_LIMIT, orderBy: { acceptedAt: "desc" } })
      : Promise.resolve([]),
    canManageTeam
      ? prisma.teamMember.findMany({ where: { OR: [{ name: { contains: query, mode: "insensitive" } }, { roleTitle: { contains: query, mode: "insensitive" } }, { user: { is: searchWhere(query) } }] }, select: { id: true, name: true, roleTitle: true, user: { select: { id: true, username: true } } }, take: SEARCH_LIMIT, orderBy: { order: "asc" } })
      : Promise.resolve([]),
    canManageAchievements
      ? prisma.achievement.findMany({ where: { OR: [{ name: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }] }, select: { id: true, name: true, active: true }, take: SEARCH_LIMIT, orderBy: { order: "asc" } })
      : Promise.resolve([]),
    canManageCosmetics
      ? prisma.cosmetic.findMany({ where: { OR: [{ name: { contains: query, mode: "insensitive" } }, { slug: { contains: query, mode: "insensitive" } }] }, select: { id: true, name: true, slug: true, active: true }, take: SEARCH_LIMIT, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
    canManagePosts
      ? prisma.post.findMany({ where: { OR: [{ title: { contains: query, mode: "insensitive" } }, { slug: { contains: query, mode: "insensitive" } }] }, select: { id: true, title: true, slug: true, published: true }, take: SEARCH_LIMIT, orderBy: { updatedAt: "desc" } })
      : Promise.resolve([]),
    canManageWiki
      ? prisma.wikiArticle.findMany({ where: { OR: [{ title: { contains: query, mode: "insensitive" } }, { slug: { contains: query, mode: "insensitive" } }] }, select: { id: true, title: true, slug: true, state: true }, take: SEARCH_LIMIT, orderBy: { updatedAt: "desc" } })
      : Promise.resolve([]),
  ]);

  const allGroups: AdminSearchGroup[] = [
    { id: "users", items: users.map((user) => ({ id: user.id, label: identityLabel(user), detail: user.email, href: `/admin/users/${user.id}` })) },
    { id: "creators", items: creators.map((creator) => ({ id: creator.id, label: identityLabel(creator.user), detail: creator.user.username ? `@${creator.user.username}` : null, href: `/admin/users/${creator.user.id}` })) },
    { id: "team", items: team.map((member) => ({ id: member.id, label: member.name, detail: member.roleTitle, href: member.user?.id ? `/admin/users/${member.user.id}` : "/admin/team" })) },
    { id: "achievements", items: achievements.map((achievement) => ({ id: achievement.id, label: achievement.name, detail: null, href: "/admin/achievements" })) },
    { id: "cosmetics", items: cosmetics.map((cosmetic) => ({ id: cosmetic.id, label: cosmetic.name, detail: cosmetic.slug, href: "/admin/cosmeticos" })) },
    { id: "content", items: [...posts.map((post) => ({ id: post.id, label: post.title, detail: post.slug, href: `/admin/posts/${post.id}` })), ...wiki.map((article) => ({ id: article.id, label: article.title, detail: article.slug, href: `/admin/wiki/${article.id}` }))] },
  ];
  const groups = allGroups.filter((group) => group.items.length > 0);

  return { query, groups };
}

export interface AdminSearchGroup {
  id: "users" | "creators" | "team" | "achievements" | "cosmetics" | "content";
  items: Array<{ id: string; label: string; detail: string | null; href: string }>;
}

export async function getAdminUserOverview(userId: string) {
  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, username: true, displayName: true, name: true, email: true, image: true, role: true,
      createdAt: true, emailVerified: true, twoFactorEnabled: true,
      progress: { select: { level: true, xp: true } },
      wallet: { select: { balance: true } },
      premiumEntitlements: { where: activePremiumWhere(now), select: { id: true, expiresAt: true }, take: 1 },
      creatorProfile: { select: { id: true, status: true, category: true, featured: true } },
      cosmetics: { select: { acquiredAt: true, cosmetic: { select: { id: true, name: true, slug: true, type: true, active: true } } }, orderBy: { acquiredAt: "desc" }, take: 6 },
      sanctionsReceived: { select: { id: true, type: true, reason: true, createdAt: true, expiresAt: true, revokedAt: true }, orderBy: { createdAt: "desc" }, take: 4 },
      reportsTargeting: { select: { id: true, status: true, reason: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 4 },
      achievementsEarned: { select: { awardedAt: true, achievement: { select: { id: true, name: true, iconKey: true } } }, orderBy: { awardedAt: "desc" }, take: 6 },
      teamMembership: { select: { id: true, roleTitle: true, active: true } },
    },
  });
  if (!user) throw new AdminPlatformError("User not found", 404);

  const activity = await listAdminActionLog({ limit: 8, targetId: user.id });
  return { ...user, activity };
}
