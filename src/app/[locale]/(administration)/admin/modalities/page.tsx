import { prisma } from "@/infrastructure/database/prisma";
import { requireSectionPage } from "@/modules/administration/page-guard";
import ModalitiesManager from "@/modules/administration/components/modalities-manager";
import { PageHeader } from "@/modules/administration/components/ui/page-header";
import { SECTION_ICONS } from "@/modules/administration/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function ModalitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireSectionPage("modalities", locale);

  const modalities = await prisma.modality.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  return (
    <div>
      <PageHeader
        icon={SECTION_ICONS.modalities}
        title="Modalidades"
        description="Las páginas de juego que aparecen en TFL Network."
      />
      <ModalitiesManager
        initialModalities={modalities.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          icon: m.icon,
          postsCount: m._count.posts,
        }))}
      />
    </div>
  );
}
