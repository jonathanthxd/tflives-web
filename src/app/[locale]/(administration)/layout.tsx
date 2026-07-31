import { redirect } from "@/i18n/navigation";
import AdminSidebar from "@/modules/administration/components/admin-sidebar";
import { createClient } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return redirect({ href: "/", locale });
  }

  const profile = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { role: true },
  });

  if (profile?.role !== "ADMIN") {
    redirect({ href: "/", locale });
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="ml-64 min-h-screen p-8">{children}</main>
    </div>
  );
}
