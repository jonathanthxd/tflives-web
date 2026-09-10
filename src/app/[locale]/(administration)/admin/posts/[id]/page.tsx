import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/infrastructure/database/prisma";
import { requireSectionPage } from "@/modules/administration/page-guard";
import ContentManager from "@/modules/administration/components/content-manager";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await requireSectionPage("posts", locale);
  const t = await getTranslations("Content");
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();
  const modalities = await prisma.modality.findMany({
    select: { id: true, name: true },
  });
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">{t("posts")}</h1>
      <ContentManager
        kind="posts"
        initialItems={[]}
        modalities={modalities}
        initialEdit={JSON.parse(JSON.stringify(post))}
      />
    </div>
  );
}
