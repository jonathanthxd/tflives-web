"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Coins, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { formatUserDateTime } from "@/shared/lib/date-time";

interface WalletUser {
  id: string;
  username: string | null;
  displayName: string | null;
  name: string | null;
  email: string;
  balance: number;
}

interface WalletDetail {
  user: Omit<WalletUser, "balance">;
  balance: number;
  transactions: Array<{
    id: string;
    type: "LEVEL_REWARD" | "ACHIEVEMENT_REWARD" | "ADMIN_GRANT" | "ADMIN_DEDUCT" | "SPEND";
    amount: number;
    balanceAfter: number;
    description: string | null;
    createdAt: string;
  }>;
}

function formatCoins(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

export default function WalletManager() {
  const t = useTranslations("WalletAdmin");
  const tCompletion = useTranslations("Completion");
  const tWallet = useTranslations("Wallet");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<WalletUser[]>([]);
  const [selected, setSelected] = useState<WalletDetail | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [direction, setDirection] = useState<"GRANT" | "DEDUCT">("GRANT");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/wallet?query=${encodeURIComponent(query.trim())}`);
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || t("searchError"));
        return;
      }
      setUsers(payload.users || []);
    } catch { setError(tCompletion("networkError")); } finally {
      setBusy(false);
    }
  }

  async function selectUser(user: WalletUser) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/wallet/${user.id}`);
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || t("detailError"));
        return;
      }
      setSelected(payload as WalletDetail);
      setAmount("");
      setReason("");
    } catch { setError(tCompletion("networkError")); } finally {
      setBusy(false);
    }
  }

  async function submitAdjustment() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/wallet/${selected.user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction, amount: Number(amount), reason }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || t("adjustError"));
        return;
      }
      await selectUser({ ...selected.user, balance: payload.balance });
    } catch { setError(tCompletion("networkError")); } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="rounded-2xl border border-primary/10 bg-card/20 p-5 sm:p-6">
        <label className="text-sm font-medium text-foreground" htmlFor="wallet-user-search">{t("searchLabel")}</label>
        <div className="mt-2 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="wallet-user-search"
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary/40"
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && void search()}
            />
          </div>
          <Button size="sm" onClick={() => void search()} disabled={busy}>{t("search")}</Button>
        </div>

        {users.length > 0 && (
          <div className="mt-4 divide-y divide-border rounded-xl border border-border">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => void selectUser(user)}
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-primary/5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{user.displayName || user.name || user.username || user.email}</span>
                  <span className="block truncate text-xs text-muted-foreground">{user.username ? `@${user.username}` : user.email}</span>
                </span>
                <span className="shrink-0 font-mono text-sm text-primary">{formatCoins(user.balance, locale)} TFL</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="rounded-2xl border border-primary/10 bg-card/20 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">{selected.user.displayName || selected.user.name || selected.user.username || selected.user.email}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{selected.user.username ? `@${selected.user.username}` : selected.user.email}</p>
              </div>
              <span className="rounded-xl bg-primary/10 px-3 py-2 font-mono text-sm font-semibold text-primary">{formatCoins(selected.balance, locale)} TFL</span>
            </div>
            <h3 className="mt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("history")}</h3>
            {selected.transactions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {selected.transactions.map((transaction) => {
                  const credit = transaction.amount > 0;
                  const Icon = credit ? ArrowDownLeft : ArrowUpRight;
                  return (
                    <li key={transaction.id} className="flex gap-3 py-3">
                      <Icon className={`mt-0.5 size-4 shrink-0 ${credit ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{tWallet(`transactionTypes.${transaction.type}`)}</p>
                        {transaction.description && <p className="mt-0.5 text-xs text-muted-foreground">{transaction.description}</p>}
                        <p className="mt-0.5 text-xs text-muted-foreground">{formatUserDateTime(transaction.createdAt, locale)}</p>
                      </div>
                      <div className="shrink-0 text-right font-mono text-sm">
                        <p className={credit ? "text-primary" : "text-foreground"}>{credit ? "+" : "−"}{formatCoins(Math.abs(transaction.amount), locale)} TFL</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{tWallet("balanceAfter", { balance: formatCoins(transaction.balanceAfter, locale) })}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="h-fit rounded-2xl border border-primary/15 bg-primary/5 p-5">
            <div className="flex items-center gap-2 text-primary"><Coins className="size-4" aria-hidden="true" /><h2 className="font-display text-sm font-semibold uppercase tracking-wide">{t("adjustTitle")}</h2></div>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">{t("adjustDescription")}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(["GRANT", "DEDUCT"] as const).map((value) => (
                <button key={value} type="button" onClick={() => setDirection(value)} className={`rounded-xl border px-3 py-2 text-sm font-medium ${direction === value ? "border-primary/45 bg-primary/15 text-primary" : "border-border bg-background text-muted-foreground"}`}>{t(value === "GRANT" ? "grant" : "deduct")}</button>
              ))}
            </div>
            <label className="mt-4 block text-sm text-foreground">{t("amount")}
              <input type="number" min={1} max={100000} inputMode="numeric" className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/40" value={amount} onChange={(event) => setAmount(event.target.value)} />
            </label>
            <label className="mt-4 block text-sm text-foreground">{t("reason")}
              <textarea rows={3} maxLength={500} className="mt-1 w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/40" value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t("reasonPlaceholder")} />
            </label>
            <Button className="mt-4 w-full" onClick={() => void submitAdjustment()} disabled={busy || !Number.isInteger(Number(amount)) || Number(amount) < 1 || !reason.trim()}>
              {direction === "GRANT" ? t("grant") : t("deduct")}
            </Button>
          </section>
        </div>
      )}
    </div>
  );
}
