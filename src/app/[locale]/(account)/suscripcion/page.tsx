import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { getUserPremiumStatus } from "@/modules/cosmetics/service";
import { Card } from "@/shared/ui/card";
import { Crown, Clock, Shield } from "lucide-react";

export const instant = false;

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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t("inactive")}</p>
      </div>
    );
  }

  const status = await getUserPremiumStatus(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <div>
        <h1 className="font-display text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Crown className={`h-5 w-5 ${status.active ? "text-yellow-500" : "text-muted-foreground"}`} />
          <h2 className="font-display text-lg font-semibold">
            {status.active ? t("active") : t("inactive")}
          </h2>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          {status.active ? t("activeDescription") : t("inactiveDescription")}
        </p>

        {status.active && (
          <div className="space-y-3 rounded-xl bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t("grantedAt")}:</span>
              <span className="font-medium">{new Date(status.grantedAt).toLocaleDateString(locale === "en" ? "en-US" : "es-CO")}</span>
            </div>
            {status.expiresAt ? (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t("expiresAt")}:</span>
                <span className="font-medium">{new Date(status.expiresAt).toLocaleDateString(locale === "en" ? "en-US" : "es-CO")}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t("noExpiry")}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t("source")}:</span>
              <span className="font-medium">{status.source}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
