"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
interface Counts {
  member_count: number | null;
  presence_count: number | null;
}
export default function DiscordWidget() {
  const t = useTranslations("Content");
  const [data, setData] = useState<Counts | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const update = () =>
      fetch("/api/discord", { signal: controller.signal })
        .then((r) => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then(setData)
        .catch(() => {});
    void update();
    const timer = setInterval(update, 300000);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, []);
  return (
    <details className="fixed bottom-4 right-4 z-40 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/20 bg-[#4752C4] text-white shadow-lg">
      <summary className="cursor-pointer rounded-2xl px-4 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
        Discord{" "}
        {data?.member_count != null ? data.member_count.toLocaleString() : ""}
      </summary>
      <div className="w-64 space-y-3 px-4 pb-4 text-sm">
        <p>
          {t("members")}: {data?.member_count ?? t("unavailable")}
        </p>
        <p>
          {t("onlineMembers")}: {data?.presence_count ?? t("unavailable")}
        </p>
        <a
          href="https://discord.com/invite/c3jFPyJ9vd"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block underline"
        >
          {t("discord")}
        </a>
      </div>
    </details>
  );
}
