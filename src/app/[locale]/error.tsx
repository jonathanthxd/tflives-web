"use client";

import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function SectionError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("Completion");
  return <main className="mx-auto flex min-h-[60dvh] max-w-xl flex-col items-center justify-center gap-5 px-6 py-28 text-center">
    <div className="tfl-glass tfl-glass-soft w-full rounded-3xl border border-primary/20 p-8">
      <h1 className="font-display text-2xl font-semibold">{t("pageError")}</h1>
      <p className="mt-3 text-sm text-muted-foreground" role="alert">{t("pageErrorDescription")}</p>
      <button onClick={retry} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary/10 px-5 text-primary hover:bg-primary/20"><RefreshCw className="size-4" />{t("retry")}</button>
      <Link href="/" className="mt-4 block text-sm text-muted-foreground hover:text-primary">{t("home")}</Link>
    </div>
  </main>;
}
