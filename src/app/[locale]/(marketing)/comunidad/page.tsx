import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { connection } from "next/server";
import { listPublicActivity } from "@/modules/community/activity";
import { translated } from "@/modules/editorial/publication";
import {
  PublicShell,
  AreaLinks,
  PostsFeed,
  Empty,
  panel,
} from "@/modules/network/components/public-content";
import { DiscordPanel } from "@/modules/network/components/status-panel";
import { contentMetadata } from "@/modules/editorial/metadata";
import { Link } from "@/i18n/navigation";
export const instant = false;
export const generateMetadata = () =>
  contentMetadata("community", "communityDescription", "/comunidad");
export default async function CommunityPage() {
  // The activity visibility query compares scheduled posts with the current
  // time, so it must run for the current request rather than at build time.
  await connection();
  const [t, locale, activity] = await Promise.all([
    getTranslations("Content"),
    getLocale(),
    listPublicActivity(),
  ]);
  return (
    <PublicShell title={t("community")} description={t("communityDescription")}>
      <AreaLinks />
      <Suspense fallback={<Empty>{t("unavailable")}</Empty>}>
        <DiscordPanel />
      </Suspense>
      <h2 className="font-display text-2xl">{t("latest")}</h2>
      <PostsFeed limit={6} />
      <h2 className="font-display text-2xl">{t("activity")}</h2>
      {activity.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {activity.map((item) => (
            <article key={item.id} className={panel}>
              <p className="text-sm text-muted-foreground">
                {item.author.username ? (
                  <Link
                    className="text-primary"
                    href={`/perfil/${item.author.username}`}
                  >
                    {item.author.displayName ?? item.author.name}
                  </Link>
                ) : (
                  (item.author.displayName ?? item.author.name)
                )}{" "}
                · {item.createdAt.toLocaleDateString(locale)}
              </p>
              <p className="my-4 break-words line-clamp-3">{item.content}</p>
              <Link
                className="text-sm text-primary"
                href={`/network/${item.post.slug}`}
              >
                {translated(item.post, locale).title}
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <Empty>{t("activityEmpty")}</Empty>
      )}
    </PublicShell>
  );
}
