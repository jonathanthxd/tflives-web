import { redirect } from "@/i18n/navigation";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import { canAccessSection, type AdminSection } from "@/modules/administration/permissions";
import { Role } from "@prisma/client";

export async function requireSectionPage(
  section: AdminSection,
  locale: string
): Promise<{ userId: string; role: Role }> {
  const authUser = await getCurrentAuthUser();
  if (!authUser) {
    return redirect({ href: "/", locale });
  }

  const profile = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true },
  });
  if (!profile || !canAccessSection(profile.role, section)) {
    return redirect({ href: "/admin", locale });
  }

  return { userId: profile.id, role: profile.role };
}
