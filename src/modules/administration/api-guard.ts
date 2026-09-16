import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import { canAccessSection, type AdminSection } from "@/modules/administration/permissions";
import { Role } from "@prisma/client";
import { connection } from "next/server";

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
  // Admin APIs are always request-specific because authorization depends on
  // the incoming session. This must happen before their header lookup.
  await connection();
  const authUser = await getCurrentAuthUser();
  if (!authUser) throw new AdminGuardError("No autenticado", 401);

  const profile = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true },
  });
  if (!profile || !canAccessSection(profile.role, section)) {
    throw new AdminGuardError("No autorizado", 403);
  }
  return { userId: profile.id, role: profile.role };
}
