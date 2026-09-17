import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import { canAccessSection, type AdminSection } from "@/modules/administration/permissions";
import { getActiveBanOrSuspension } from "./sanctions";
import { Role } from "@prisma/client";

export class AdminGuardError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

export async function requireAdminSection(
  section: AdminSection
): Promise<{ userId: string; role: Role }> {
  const authUser = await getCurrentAuthUser();
  if (!authUser) throw new AdminGuardError("No autenticado", 401);

  const profile = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true },
  });
  if (!profile || !canAccessSection(profile.role, section)) {
    throw new AdminGuardError("No autorizado", 403);
  }
  if (await getActiveBanOrSuspension(profile.id)) throw new AdminGuardError("Tu cuenta está suspendida", 403);
  return { userId: profile.id, role: profile.role };
}
