import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";

export async function GET() {
  try {
    await requireAdminSection("analytics");

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersLast7Days,
      newUsersLast30Days,
      usersByRole,
      totalPosts,
      publishedPosts,
      archivedPosts,
      totalFriendships,
      totalMessages,
      messagesLast7Days,
      openReports,
      activeBans,
      activeMutes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.groupBy({ by: ["role"], _count: { role: true } }),
      prisma.post.count(),
      prisma.post.count({ where: { published: true } }),
      prisma.post.count({ where: { archived: true } }),
      prisma.friendship.count({ where: { status: "ACCEPTED" } }),
      prisma.directMessage.count(),
      prisma.directMessage.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.userSanction.count({
        where: { type: { in: ["BAN", "SUSPEND"] }, revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      }),
      prisma.userSanction.count({
        where: { type: "MUTE", revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      }),
    ]);

    return NextResponse.json(
      {
        users: {
          total: totalUsers,
          newLast7Days: newUsersLast7Days,
          newLast30Days: newUsersLast30Days,
          byRole: Object.fromEntries(usersByRole.map((r) => [r.role, r._count.role])),
        },
        posts: {
          total: totalPosts,
          published: publishedPosts,
          drafts: totalPosts - publishedPosts,
          archived: archivedPosts,
        },
        social: {
          friendships: totalFriendships,
          messagesTotal: totalMessages,
          messagesLast7Days,
        },
        moderation: {
          openReports,
          activeBans,
          activeMutes,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al obtener la analítica" }, { status: 500 });
  }
}
