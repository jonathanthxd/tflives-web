import { createClient } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import { canAccessSection, type AdminSection } from "@/modules/administration/permissions";
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
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
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
