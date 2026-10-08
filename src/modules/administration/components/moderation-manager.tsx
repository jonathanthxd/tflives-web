"use client";

import { useLocale, useTranslations } from "next-intl";

import { useRef, useState } from "react";
import { useInitialClientValue } from "@/shared/lib/client-value";
import { Search, Ban, Clock3, VolumeX, TriangleAlert, RotateCcw, ShieldOff, UserSearch, type LucideIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import ConfirmDialog from "@/shared/ui/confirm-dialog";
import { StatusBadge } from "@/modules/administration/components/ui/status-badge";
import { EmptyState } from "@/modules/administration/components/ui/empty-state";

type SanctionType = "BAN" | "SUSPEND" | "MUTE" | "WARNING";

interface SearchResult {
  id: string;
  username: string | null;
  displayName: string | null;
  name: string | null;
  image: string | null;
}

interface Sanction {
  id: string;
  type: SanctionType;
  reason: string;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  issuedById: string;
}



const TYPE_ICONS: Record<SanctionType, LucideIcon> = {
  BAN: Ban,
  SUSPEND: Clock3,
  MUTE: VolumeX,
  WARNING: TriangleAlert,
};

function isActive(s: Sanction, now: number | null) {
  if (s.revokedAt) return false;
  if (!s.expiresAt) return true;
  if (now === null) return true;
  return new Date(s.expiresAt).getTime() > now;
}

export default function ModerationManager() {
  const tCompletion = useTranslations("Completion");
  const completionLocale = useLocale();
const TYPE_LABELS: Record<SanctionType, string> = {
  BAN: "Ban",
  SUSPEND: tCompletion("suspension"),
  MUTE: tCompletion("mute"),
  WARNING: tCompletion("warning"),
};

  const searchSequence = useRef(0);
  const selectedRef = useRef<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [loadingSanctions, setLoadingSanctions] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const now = useInitialClientValue<number | null>(() => Date.now(), null);

  const [type, setType] = useState<SanctionType>("WARNING");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<"permanent" | "1d" | "7d" | "30d">("permanent");
  const [revoking, setRevoking] = useState<Sanction | null>(null);


  async function search(q: string) {
    const sequence = ++searchSequence.current;
    setQuery(q); setError("");
    if (q.trim().length < 2) {
      setResults([]); setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/moderation/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error("request_failed");
      if (sequence === searchSequence.current) setResults(data.results || []);
    } catch { setError(tCompletion("networkError")); } finally {
      if (sequence === searchSequence.current) setSearching(false);
    }
  }

  async function selectUser(user: SearchResult) {
    selectedRef.current = user.id;
    setSelected(user); setSanctions([]);
    setResults([]);
    setQuery("");
    setError("");
    setLoadingSanctions(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/sanctions`);
      const data = await res.json();
      if (!res.ok) throw new Error("request_failed");
      if (selectedRef.current === user.id) setSanctions(data.sanctions || []);
    } catch { setError(tCompletion("networkError")); } finally {
      setLoadingSanctions(false);
    }
  }

  function expiresAtFromDuration(): string | null {
    if (duration === "permanent") return null;
    const days = duration === "1d" ? 1 : duration === "7d" ? 7 : 30;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }

  async function applySanction() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${selected.id}/sanctions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, reason, expiresAt: expiresAtFromDuration() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || tCompletion("sanctionError"));
        return;
      }
      setSanctions((prev) => [data.sanction, ...prev]);
      setReason("");
    } catch { setError(tCompletion("networkError")); } finally {
      setBusy(false);
    }
  }

  async function confirmRevoke() {
    if (!revoking) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/sanctions/${revoking.id}`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || tCompletion("revokeError"));
        setRevoking(null);
        return;
      }
      setSanctions((prev) => prev.map((s) => (s.id === revoking.id ? data.sanction : s)));
      setRevoking(null);
    } catch { setError(tCompletion("networkError")); } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error && !selected && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
      {!selected ? (
        <div className="max-w-md">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" strokeWidth={1.75} />
            <input
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary/40"
              placeholder={tCompletion("searchPlaceholder")}
              value={query}
              onChange={(e) => search(e.target.value)}
            />
          </div>
          {searching && <p className="mt-2 text-xs text-muted-foreground">{tCompletion("searching")}</p>}
          {results.length > 0 && (
            <div className="mt-3 divide-y divide-primary/5 rounded-xl border border-primary/10 bg-card/20">
              {results.map((u) => {
                const label = u.displayName || u.name || u.username || "";
                return (
                  <button
                    key={u.id}
                    onClick={() => selectUser(u)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-primary/5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-primary/5 text-xs font-semibold text-primary">
                      {label.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{label}</div>
                      {u.username && <div className="truncate text-xs text-muted-foreground/50">@{u.username}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <div className="mt-6">
              <EmptyState icon={UserSearch} title={tCompletion("noResults")} description={tCompletion("noUsers")} />
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-primary/5 text-sm font-semibold text-primary">
                {(selected.displayName || selected.name || selected.username || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-display text-lg font-semibold text-foreground">
                  {selected.displayName || selected.name || selected.username}
                </div>
                {selected.username && <div className="text-sm text-muted-foreground/50">@{selected.username}</div>}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setSelected(null); setSanctions([]); }}>
              {tCompletion("searchAnother")}</Button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="mb-6 rounded-2xl border border-primary/10 bg-card/20 p-6">
            <h3 className="mb-4 flex items-center gap-2 font-medium text-foreground">
              <ShieldOff className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              {tCompletion("applySanction")}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary/40"
                value={type}
                onChange={(e) => setType(e.target.value as SanctionType)}
              >
                {(["WARNING", "MUTE", "SUSPEND", "BAN"] as SanctionType[]).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary/40"
                value={duration}
                onChange={(e) => setDuration(e.target.value as typeof duration)}
              >
                <option value="permanent">{tCompletion("permanent")}</option>
                <option value="1d">{tCompletion("oneDay")}</option>
                <option value="7d">{tCompletion("sevenDays")}</option>
                <option value="30d">{tCompletion("thirtyDays")}</option>
              </select>
            </div>
            <textarea
              className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary/40"
              placeholder={tCompletion("sanctionReason")}
              rows={2}
              maxLength={2000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="mt-3 flex justify-end">
              <Button size="sm" onClick={applySanction} disabled={busy || !reason.trim()}>
                {tCompletion("apply")}</Button>
            </div>
          </div>

          <h3 className="mb-3 font-medium text-foreground">{tCompletion("sanctionHistory")}</h3>
          {loadingSanctions ? (
            <p className="text-sm text-muted-foreground">{tCompletion("loading")}</p>
          ) : sanctions.length === 0 ? (
            <EmptyState icon={ShieldOff} title={tCompletion("noSanctions")} description={tCompletion("noSanctionsDescription")} />
          ) : (
            <div className="space-y-2">
              {sanctions.map((s) => {
                const active = isActive(s, now);
                const TypeIcon = TYPE_ICONS[s.type];
                return (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/10 bg-card/20 px-4 py-3.5"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                          active ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400" : "border-border bg-muted/30 text-muted-foreground"
                        }`}
                      >
                        <TypeIcon className="h-4 w-4" strokeWidth={1.75} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          {TYPE_LABELS[s.type]}
                          <StatusBadge tone={active ? "danger" : "neutral"} dot={false}>
                            {active ? tCompletion("activeF") : s.revokedAt ? tCompletion("revoked") : tCompletion("expired")}
                          </StatusBadge>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{s.reason}</div>
                        <div className="mt-1 font-mono text-[11px] text-muted-foreground/50">
                          {new Date(s.createdAt).toLocaleDateString(completionLocale)}
                          {s.expiresAt && ` · ${tCompletion("expires", { date: new Date(s.expiresAt).toLocaleDateString(completionLocale) })}`}
                        </div>
                      </div>
                    </div>
                    {active && (
                      <button
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                        onClick={() => setRevoking(s)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
                        {tCompletion("revoke")}</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!revoking}
        title={tCompletion("revokeSanction")}
        description={tCompletion("revokeDescription")}
        confirmLabel={tCompletion("revoke")}
        cancelLabel={tCompletion("cancel")}
        busy={busy}
        onConfirm={confirmRevoke}
        onCancel={() => setRevoking(null)}
      />
    </div>
  );
}
