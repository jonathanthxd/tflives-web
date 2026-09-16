import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import {
  PublicShell,
  AreaLinks,
  ModalityCards,
  PostsFeed,
  StaffLink,
  PublicSectionSkeleton,
} from "@/modules/network/components/public-content";
import { NetworkStatusPanel } from "@/modules/network/components/status-panel";
import { contentMetadata } from "@/modules/editorial/metadata";
import { getCachedPublicModalities } from "@/modules/network/cache/public-content-cache";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return contentMetadata("modalities", "networkDescription", "/network", locale);
}

type NetworkSearchParams = Promise<{ modality?: string }>;

async function NetworkEditorialFeed({
  searchParams,
  locale,
}: {
  searchParams: NetworkSearchParams;
  locale: Locale;
}) {
  const [query, modes, t] = await Promise.all([
    searchParams,
    getCachedPublicModalities(),
    getTranslations({ locale, namespace: "Content" }),
  ]);
  const requestedModalityId =
    typeof query.modality === "string" ? query.modality : undefined;
  const modalityId = modes.some((mode) => mode.id === requestedModalityId)
    ? requestedModalityId
    : undefined;

  return (
    <>
      <form className="flex flex-wrap gap-3 items-end">
        <label>
          {t("modalityId")}
          <select
            name="modality"
            defaultValue={modalityId ?? ""}
            className="ml-3 rounded-xl border border-border bg-background p-3"
          >
            <option value="">{t("all")}</option>
            {modes.map((mode) => (
              <option key={mode.id} value={mode.id}>
                {mode.name}
              </option>
            ))}
          </select>
        </label>
        <button className="rounded-xl bg-primary/10 px-5 py-3 text-primary">
          {t("filter")}
        </button>
      </form>
      <PostsFeed locale={locale} modalityId={modalityId} />
    </>
  );
}

export default async function NetworkPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: NetworkSearchParams;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Content" });

  return (
    <PublicShell title="TFL Network" description={t("networkDescription")}>
      <AreaLinks locale={locale} />

      <Suspense fallback={<PublicSectionSkeleton rows={4} />}>
        <NetworkStatusPanel />
      </Suspense>

      <h2 className="font-display text-2xl font-semibold">{t("modalities")}</h2>
      <Suspense fallback={<PublicSectionSkeleton rows={3} />}>
        <ModalityCards locale={locale} />
      </Suspense>
      <Suspense fallback={null}>
        <StaffLink section="modalities" href="/admin/modalities" />
      </Suspense>

      <h2 className="font-display text-2xl font-semibold">{t("latest")}</h2>
      <Suspense fallback={<PublicSectionSkeleton rows={5} />}>
        <NetworkEditorialFeed searchParams={searchParams} locale={locale} />
      </Suspense>
      <Suspense fallback={null}>
        <StaffLink section="posts" href="/admin/posts" />
      </Suspense>
    </PublicShell>
  );
}
