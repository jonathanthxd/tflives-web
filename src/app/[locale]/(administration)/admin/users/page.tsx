import { prisma } from "@/infrastructure/database/prisma";
import { requireSectionPage } from "@/modules/administration/page-guard";
import UsersManager from "@/modules/administration/components/users-manager";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { userId } = await requireSectionPage("users", locale);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      displayName: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageHeader
        icon={SECTION_ICONS.users}
        title="Usuarios y roles"
        description="Buscá una cuenta y cambiá su rol. Solo ADMIN puede tocar roles."
      />
      <UsersManager
        initialUsers={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        currentUserId={userId}
      />
    </div>
  );
}
