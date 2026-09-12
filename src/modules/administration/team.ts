import { prisma } from "@/infrastructure/database/prisma";

const linkedUserSelect = {
  id: true,
  username: true,
  displayName: true,
  name: true,
  image: true,
} as const;

export async function listPublicTeam() {
  return prisma.teamMember.findMany({
    where: { active: true, userId: { not: null } },
    include: { user: { select: linkedUserSelect } },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}

export async function listAllTeamMembers() {
  const items = await prisma.teamMember.findMany({
    include: { user: { select: linkedUserSelect } },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return items.map((item) => ({
    ...item,
    name: item.user ? item.user.displayName || item.user.name || item.user.username || item.name : item.name,
    avatarUrl: item.user?.image ?? item.avatarUrl,
    username: item.user?.username ?? "",
  }));
}
