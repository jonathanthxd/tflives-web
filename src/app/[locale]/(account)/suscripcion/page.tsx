import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Crown, Clock, Shield, Sparkles, Gift, BadgeCheck } from "lucide-react";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { getUserPremiumStatus } from "@/modules/cosmetics/service";
import { DISCORD_INVITE } from "@/infrastructure/external-services/discord";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/utilities/utils";

export const instant = false;

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale === "en" ? "en-US" : "es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function SubscriptionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await connection();
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Subscription" });
  const user = await getCurrentAuthUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <Card className="p-8 text-center">
          <Crown className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("notLoggedIn")}</p>
          <Link
            href="/login?redirect=/suscripcion"
            className={cn(buttonVariants(), "mt-6")}
          >
            {t("signIn")}
          </Link>
        </Card>
      </main>
    );
  }

  const status = await getUserPremiumStatus(user.id);
  const sourceLabel =
    status.active && status.source === "ADMIN" ? t("sourceAdmin") : null;

  const benefits = [
    { icon: Sparkles, text: t("benefitCosmetics") },
    { icon: Shield, text: t("benefitSupport") },
    { icon: BadgeCheck, text: t("benefitBadge") },
  ];

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`grid size-11 place-items-center rounded-2xl ${
                status.active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              <Crown className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("statusTitle")}
              </p>
              <h2 className="font-display text-lg font-semibold text-foreground">
                {status.active ? t("active") : t("inactive")}
              </h2>
            </div>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest ${
              status.active
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-muted/60 text-muted-foreground"
            }`}
          >
            {status.active ? t("active") : t("inactive")}
          </span>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {status.active ? t("activeDescription") : t("inactiveDescription")}
        </p>

        {status.active && (
          <dl className="mt-5 grid gap-3 rounded-xl bg-primary/5 p-4 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <dt className="text-muted-foreground">{t("grantedAt")}:</dt>
              <dd className="font-medium text-foreground">
                {formatDate(status.grantedAt, locale)}
              </dd>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <dt className="text-muted-foreground">{t("expiresAt")}:</dt>
              <dd className="font-medium text-foreground">
                {status.expiresAt ? formatDate(status.expiresAt, locale) : t("noExpiry")}
              </dd>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <dt className="text-muted-foreground">{t("source")}:</dt>
              <dd className="font-medium text-foreground">
                {sourceLabel ?? status.source}
              </dd>
            </div>
          </dl>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
          {t("benefitsTitle")}
        </h2>
        <ul className="mt-4 space-y-3">
          {benefits.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-sm text-muted-foreground">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Gift className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
            {t("howToGetTitle")}
          </h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{t("howToGet")}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/cosmeticos"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {t("exploreShop")}
          </Link>
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants())}
          >
            {t("contactAdmin")}
          </a>
        </div>
      </Card>
    </main>
  );
}
