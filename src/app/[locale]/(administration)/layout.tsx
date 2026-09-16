import { redirect } from "@/i18n/navigation";
import { AdminShell } from "@/modules/administration/components/admin-shell";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import { canAccessAdminPanel } from "@/modules/administration/permissions";

export const instant = false;

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const authUser = await getCurrentAuthUser();

  if (!authUser) {
    return redirect({ href: "/", locale });
  }

  const profile = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { role: true },
  });

  if (!profile || !canAccessAdminPanel(profile.role)) {
    return redirect({ href: "/", locale });
  }

  return <AdminShell role={profile.role}>{children}</AdminShell>;
}
