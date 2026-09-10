import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/infrastructure/database/prisma";
import {
  PublicShell,
  AreaLinks,
  ModalityCards,
  PostsFeed,
  StaffLink,
  Empty,
} from "@/modules/network/components/public-content";
import { NetworkStatusPanel } from "@/modules/network/components/status-panel";
import { publicModalities } from "@/modules/editorial/publication";
import { contentMetadata } from "@/modules/editorial/metadata";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const generateMetadata = () =>
  contentMetadata("modalities", "networkDescription", "/network");
export default async function NetworkPage({
  searchParams,
}: {
  searchParams: Promise<{ modality?: string }>;
}) {
  const [t, query, modes] = await Promise.all([
    getTranslations("Content"),
    searchParams,
    prisma.modality.findMany({
      where: publicModalities,
      orderBy: { order: "asc" },
    }),
  ]);
  return (
    <PublicShell title="TFL Network" description={t("networkDescription")}>
      <AreaLinks />
      <Suspense fallback={<Empty>{t("unavailable")}</Empty>}>
        <NetworkStatusPanel />
      </Suspense>
      <h2 className="font-display text-2xl font-semibold">{t("modalities")}</h2>
      <ModalityCards />
      <StaffLink section="modalities" href="/admin/modalities" />
      <h2 className="font-display text-2xl font-semibold">{t("latest")}</h2>
      <form className="flex flex-wrap gap-3 items-end">
        <label>
          {t("modalityId")}
          <select
            name="modality"
            defaultValue={typeof query.modality === "string" ? query.modality : ""}
            className="ml-3 rounded-xl border border-border bg-background p-3"
          >
            <option value="">{t("all")}</option>
            {modes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <button className="rounded-xl bg-primary/10 px-5 py-3 text-primary">
          {t("filter")}
        </button>
      </form>
      <PostsFeed modalityId={typeof query.modality === "string" ? query.modality : undefined} />
      <StaffLink section="posts" href="/admin/posts" />
    </PublicShell>
  );
}
