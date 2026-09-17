import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("Completion");
  return <div role="status" aria-busy="true" className="mx-auto min-h-[60dvh] max-w-5xl space-y-5 px-6 py-28">
    <p className="text-sm text-muted-foreground">{t("loading")}</p>
    <div className="h-9 w-2/3 animate-pulse rounded-xl bg-primary/10" />
    <div className="h-52 animate-pulse rounded-3xl border border-primary/10 bg-primary/5" />
  </div>;
}
