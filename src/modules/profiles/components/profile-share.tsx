"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Share2 } from "lucide-react";
import { absoluteUrl, localePath } from "@/config/site";

export default function ProfileShare({ username, name }: { username: string; name: string }) {
  const t = useTranslations("ProfileCards");
  const locale = useLocale();
  const [status, setStatus] = useState<"copied" | "copyError" | null>(null);
  const share = async () => {
    const url = absoluteUrl(localePath(locale, `/perfil/${username}`));
    try {
      if (navigator.share) await navigator.share({ title: `${name} — TFLives`, url });
      else { await navigator.clipboard.writeText(url); setStatus("copied"); }
    } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setStatus("copyError"); }
  };
  return <span className="inline-flex flex-col items-start gap-1"><button type="button" onClick={() => { void share(); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card/60 px-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"><Share2 className="size-3.5" aria-hidden />{t("share")}</button>{status && <span role="status" className="max-w-64 text-[11px] text-muted-foreground">{t(status)}</span>}</span>;
}
