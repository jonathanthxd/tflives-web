"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Coins, History } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/shared/ui/card";
import { formatUserDateTime } from "@/shared/lib/date-time";

interface WalletTransactionView {
  type: "LEVEL_REWARD" | "ACHIEVEMENT_REWARD" | "ADMIN_GRANT" | "ADMIN_DEDUCT" | "SPEND";
  amount: number;
  balanceAfter: number;
  createdAt: string;
}

interface WalletSummary {
  balance: number;
  recentTransactions: WalletTransactionView[];
}

function formatCoins(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

export function WalletSettings() {
  const t = useTranslations("Wallet");
  const locale = useLocale();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/account/wallet", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("wallet");
        return response.json() as Promise<WalletSummary>;
      })
      .then(setWallet)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <Card className="p-5 sm:p-6">
        <p role="alert" className="text-sm text-destructive">{t("loadError")}</p>
      </Card>
    );
  }

  if (!wallet) {
    return (
      <Card aria-busy="true" className="flex min-h-44 items-center justify-center p-5 sm:p-6">
        <div className="size-7 animate-spin rounded-full border-2 border-primary/30 border-t-primary" aria-label={t("loading")} />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Coins className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">{t("title")}</h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{t("description")}</p>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("balance")}</p>
          <p className="mt-1 font-display text-3xl font-bold text-foreground">
            {formatCoins(wallet.balance, locale)} <span className="text-lg text-primary">TFL</span>
          </p>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">{t("notice")}</p>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <History className="size-4 text-primary" aria-hidden="true" />
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">{t("history")}</h2>
        </div>
        {wallet.recentTransactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {wallet.recentTransactions.map((transaction, index) => {
              const credit = transaction.amount > 0;
              const Icon = credit ? ArrowDownLeft : ArrowUpRight;
              return (
                <li key={`${transaction.createdAt}-${index}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${credit ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{t(`transactionTypes.${transaction.type}`)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatUserDateTime(transaction.createdAt, locale)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`font-mono text-sm font-semibold ${credit ? "text-primary" : "text-foreground"}`}>
                      {credit ? "+" : "−"}{formatCoins(Math.abs(transaction.amount), locale)} TFL
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {t("balanceAfter", { balance: formatCoins(transaction.balanceAfter, locale) })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
