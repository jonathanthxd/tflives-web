import { redirect } from "@/i18n/navigation";
import AdminSidebar from "@/modules/administration/components/admin-sidebar";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import { canAccessAdminPanel } from "@/modules/administration/permissions";

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

  return (
    <div className="content-surface relative min-h-screen bg-background">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-96"
        style={{
          background:
            "radial-gradient(60rem 24rem at 70% -10%, hsl(var(--primary) / 0.08), transparent 70%)",
        }}
      />
      <AdminSidebar role={profile.role} />
      <main className="relative z-10 min-w-0 lg:ml-64 min-h-screen px-4 sm:px-8 pb-16 pt-8 lg:pt-28">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
