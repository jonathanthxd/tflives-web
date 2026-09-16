import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import CreatorApplicationForm from "@/modules/creators/components/creator-application-form";

export const instant = false;

export default async function CreatorApplicationPage({ params }: { params: Promise<{ locale: string }> }) {
  const [{ locale }, authUser, t] = await Promise.all([params, getCurrentAuthUser(), getTranslations("Creators")]);
  if (!authUser) redirect(`/${locale}/login`);
  return <main className="min-h-screen px-4 pb-14 pt-24 sm:px-6"><section className="mx-auto max-w-2xl"><p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("eyebrow")}</p><h1 className="mt-2 font-display text-3xl font-bold text-foreground">{t("applyTitle")}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{t("applyDescription")}</p><div className="mt-7"><CreatorApplicationForm /></div></section></main>;
}
