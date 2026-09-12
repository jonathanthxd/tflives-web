import { getTranslations } from "next-intl/server";
import { ExternalLink, ShieldAlert, UserRound } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { requireSectionPage } from "@/modules/administration/page-guard";
import { AdminPlatformError, getAdminUserOverview } from "@/modules/administration/platform-service";
import { PageHeader } from "@/modules/administration/components/ui/page-header";

export const dynamic = "force-dynamic";

function accountState(user: { emailVerified: boolean; twoFactorEnabled: boolean }) {
  if (!user.emailVerified) return "unverified";
  return user.twoFactorEnabled ? "protected" : "active";
}

function roleKey(role: "USER" | "MOD" | "ADMIN") {
  return `role${role.charAt(0)}${role.slice(1).toLowerCase()}`;
}

export default async function AdminUserOverviewPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  await requireSectionPage("users", locale);
  const t = await getTranslations({ locale, namespace: "AdminPlatform" });
  let user;
  try { user = await getAdminUserOverview(id); } catch (error) {
    if (error instanceof AdminPlatformError && error.status === 404) return redirect({ href: "/admin/users", locale });
    throw error;
  }
  const label = user.displayName || user.name || user.username || t("unknownUser");
  const activeSanctions = user.sanctionsReceived.filter((sanction) => !sanction.revokedAt && (!sanction.expiresAt || sanction.expiresAt > new Date()));
  const links = [
    user.username ? { id: "publicProfile", href: `/perfil/${user.username}`, external: true } : null,
    { id: "economy", href: "/admin/economia" }, { id: "premium", href: "/admin/cosmeticos" }, user.creatorProfile ? { id: "creator", href: "/admin/creators" } : null, { id: "moderation", href: "/admin/moderation" }, { id: "audit", href: `/admin/staff-log?target=${encodeURIComponent(user.id)}` },
  ].filter((link): link is { id: string; href: string; external?: boolean } => link !== null);

  return (
    <div className="space-y-8">
      <PageHeader icon={UserRound} title={label} description={user.username ? `@${user.username}` : t("userOverviewDescription")} actions={<Link href="/admin/users" className="text-sm font-medium text-primary hover:underline">{t("backToUsers")}</Link>} />
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-2xl border border-primary/10 bg-card/25 p-5"><h2 className="font-display text-lg font-semibold">{t("identity")}</h2><dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2"><div><dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("username")}</dt><dd className="mt-1 text-sm font-medium">{user.username ? `@${user.username}` : "—"}</dd></div><div><dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("email")}</dt><dd className="mt-1 break-all text-sm font-medium">{user.email}</dd></div><div><dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("role")}</dt><dd className="mt-1 text-sm font-medium">{t(roleKey(user.role))}</dd></div><div><dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("accountState")}</dt><dd className="mt-1 text-sm font-medium">{t(`state${accountState(user).charAt(0).toUpperCase()}${accountState(user).slice(1)}`)}</dd></div><div><dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("joined")}</dt><dd className="mt-1 text-sm font-medium"><time dateTime={user.createdAt.toISOString()}>{user.createdAt.toLocaleDateString(locale)}</time></dd></div><div><dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("security")}</dt><dd className="mt-1 text-sm font-medium">{user.twoFactorEnabled ? t("twoFactorOn") : t("twoFactorOff")}</dd></div></dl></div>
        <div className="rounded-2xl border border-primary/10 bg-card/25 p-5"><h2 className="font-display text-lg font-semibold">{t("accountContext")}</h2><dl className="mt-4 grid grid-cols-2 gap-4"><div><dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("level")}</dt><dd className="mt-1 font-mono text-xl font-medium">{user.progress?.level ?? 1}</dd></div><div><dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("coins")}</dt><dd className="mt-1 font-mono text-xl font-medium">{user.wallet?.balance ?? 0}</dd></div><div><dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("premium")}</dt><dd className="mt-1 text-sm font-medium">{user.premiumEntitlements.length ? t("yes") : t("no")}</dd></div><div><dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("creator")}</dt><dd className="mt-1 text-sm font-medium">{user.creatorProfile ? t(`creator${user.creatorProfile.status.charAt(0)}${user.creatorProfile.status.slice(1).toLowerCase()}`) : t("notCreator")}</dd></div></dl></div>
      </section>
      <section aria-labelledby="user-links"><h2 id="user-links" className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/60">{t("relatedTools")}</h2><div className="mt-3 flex flex-wrap gap-2.5">{links.map((link) => <Link key={link.id} href={link.href} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/40 px-4 py-2.5 text-sm font-medium hover:border-primary/30 hover:bg-primary/10">{t(`link${link.id.charAt(0).toUpperCase()}${link.id.slice(1)}`)}{link.external && <ExternalLink className="h-3.5 w-3.5 text-primary" />}</Link>)}</div></section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-primary/10 bg-card/25 p-5"><h2 className="font-display text-lg font-semibold">{t("cosmetics")}</h2>{user.cosmetics.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">{t("noCosmetics")}</p> : <ul className="mt-4 space-y-2">{user.cosmetics.map((entry) => <li key={entry.cosmetic.id} className="flex items-center justify-between gap-3 rounded-lg bg-background/40 px-3 py-2.5"><span className="text-sm font-medium">{entry.cosmetic.name}</span><span className="font-mono text-[11px] text-muted-foreground">{t(`cosmetic${entry.cosmetic.type.charAt(0)}${entry.cosmetic.type.slice(1).toLowerCase().replaceAll("_", "")}`)}</span></li>)}</ul>}</section>
        <section className="rounded-2xl border border-primary/10 bg-card/25 p-5"><h2 className="font-display text-lg font-semibold">{t("moderationContext")}</h2><p className={`mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${activeSanctions.length ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}><ShieldAlert className="h-4 w-4" />{activeSanctions.length ? t("activeSanctions", { count: activeSanctions.length }) : t("noActiveSanctions")}</p>{user.reportsTargeting.length > 0 && <p className="mt-3 text-sm text-muted-foreground">{t("reportsAgainstUser", { count: user.reportsTargeting.length })}</p>}</section>
      </div>
      <section className="rounded-2xl border border-primary/10 bg-card/25 p-5"><h2 className="font-display text-lg font-semibold">{t("relatedAuditActivity")}</h2>{user.activity.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">{t("noActivity")}</p> : <ol className="mt-4 divide-y divide-primary/10">{user.activity.map((entry) => <li key={entry.id} className="flex items-center justify-between gap-4 py-3"><span className="font-mono text-xs text-muted-foreground">{entry.action.replaceAll(".", " · ")}</span><time className="shrink-0 text-xs text-muted-foreground" dateTime={entry.createdAt.toISOString()}>{entry.createdAt.toLocaleDateString(locale)}</time></li>)}</ol>}</section>
    </div>
  );
}
