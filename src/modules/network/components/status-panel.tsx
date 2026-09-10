import { getLocale, getTranslations } from "next-intl/server";
import { getMinecraftStatus } from "@/infrastructure/external-services/minecraft";
import {
  getDiscordGuildCounts,
  DISCORD_INVITE,
} from "@/infrastructure/external-services/discord";
import { Link } from "@/i18n/navigation";
import { panel } from "./public-content";
import CopyIp from "./copy-ip";
export async function NetworkStatusPanel() {
  const [status, t, locale] = await Promise.all([
    getMinecraftStatus(),
    getTranslations("Content"),
    getLocale(),
  ]);
  return (
    <section className={`${panel} space-y-5`}>
      <div className="flex flex-wrap justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold">
          <Link href="/network/estado">{t("statusPage")}</Link>
        </h2>
        <span
          className={
            status.online
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground"
          }
        >
          {t(status.online ? "ONLINE" : "unavailable")} ·{" "}
          {t(status.reachable ? "reachable" : "unreachable")}
        </span>
      </div>
      <CopyIp />
      {!status.online && (
        <p className="text-sm text-muted-foreground">
          {t("networkUnavailable")}
        </p>
      )}
      <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {[
          [
            "players",
            status.players === null
              ? t("unavailable")
              : `${status.players} / ${status.maxPlayers ?? "—"}`,
          ],
          ["version", status.version ?? t("unavailable")],
          [
            "updated",
            new Date(status.checkedAt).toLocaleString(locale, {
              timeZone: "UTC",
            }) + " UTC",
          ],
          ["duration", `${status.queryDurationMs} ms`],
        ].map(([key, value]) => (
          <div key={key}>
            <dt className="text-xs text-muted-foreground">{t(key)}</dt>
            <dd className="mt-2 break-words text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
export async function DiscordPanel() {
  const [counts, t] = await Promise.all([
    getDiscordGuildCounts(),
    getTranslations("Content"),
  ]);
  return (
    <section className={`${panel} space-y-4`}>
      <h2 className="font-display text-xl font-semibold">Discord</h2>
      <dl className="flex flex-wrap gap-8">
        {[
          ["members", counts.member_count],
          ["onlineMembers", counts.presence_count],
        ].map(([key, count]) => (
          <div key={key}>
            <dt className="text-sm text-muted-foreground">{t(String(key))}</dt>
            <dd className="mt-1 text-2xl font-semibold">
              {count ?? t("unavailable")}
            </dd>
          </div>
        ))}
      </dl>
      <a
        href={DISCORD_INVITE}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-primary underline"
      >
        {t("discord")}
      </a>
    </section>
  );
}
