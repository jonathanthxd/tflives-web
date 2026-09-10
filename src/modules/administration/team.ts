import { prisma } from "@/infrastructure/database/prisma";
export async function listPublicTeam() {
  return prisma.teamMember.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}
export async function listAllTeamMembers() {
  return prisma.teamMember.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}
