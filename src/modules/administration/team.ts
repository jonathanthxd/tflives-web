import type { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import { logAdminAction } from "@/modules/administration/action-log";

export class TeamMemberError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

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

interface TeamMemberInput {
  name: string;
  roleTitle: string;
  avatarUrl?: string | null;
  order?: number;
  active?: boolean;
}

export async function createTeamMember(createdById: string, input: TeamMemberInput) {
  const name = input.name.trim();
  const roleTitle = input.roleTitle.trim();
  if (!name) throw new TeamMemberError("El nombre es obligatorio");
  if (!roleTitle) throw new TeamMemberError("El cargo es obligatorio");

  const member = await prisma.teamMember.create({
    data: {
      name,
      roleTitle,
      avatarUrl: input.avatarUrl?.trim() || null,
      order: input.order ?? 0,
      active: input.active ?? true,
      createdById,
    },
  });

  await logAdminAction({
    actorId: createdById,
    action: "team.create",
    targetType: "TeamMember",
    targetId: member.id,
    metadata: { name },
  });

  return member;
}

export async function updateTeamMember(actorId: string, id: string, input: Partial<TeamMemberInput>) {
  const existing = await prisma.teamMember.findUnique({ where: { id } });
  if (!existing) throw new TeamMemberError("Miembro no encontrado", 404);

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new TeamMemberError("El nombre es obligatorio");
    data.name = name;
  }
  if (input.roleTitle !== undefined) {
    const roleTitle = input.roleTitle.trim();
    if (!roleTitle) throw new TeamMemberError("El cargo es obligatorio");
    data.roleTitle = roleTitle;
  }
  if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl?.trim() || null;
  if (input.order !== undefined) data.order = input.order;
  if (input.active !== undefined) data.active = input.active;

  const updated = await prisma.teamMember.update({ where: { id }, data });

  await logAdminAction({
    actorId,
    action: "team.update",
    targetType: "TeamMember",
    targetId: id,
    metadata: data as Prisma.InputJsonValue,
  });

  return updated;
}

export async function deleteTeamMember(actorId: string, id: string) {
  const existing = await prisma.teamMember.findUnique({ where: { id } });
  if (!existing) throw new TeamMemberError("Miembro no encontrado", 404);

  await prisma.teamMember.delete({ where: { id } });

  await logAdminAction({
    actorId,
    action: "team.delete",
    targetType: "TeamMember",
    targetId: id,
    metadata: { name: existing.name },
  });
}
