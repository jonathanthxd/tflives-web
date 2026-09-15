"use client";

import { useMemo, useState } from "react";
import { Crown, Palette, Search, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { COSMETIC_PRESETS, COSMETIC_RARITIES, COSMETIC_TYPES, type CosmeticTypeKey, type CosmeticVisualPresetKey } from "@/modules/cosmetics/visuals";

interface AdminCosmetic {
  id: string; slug: string; type: CosmeticTypeKey; rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  name: string; description: string; nameEn: string; descriptionEn: string; price: number;
  premiumOnly: boolean; active: boolean; visualPreset: CosmeticVisualPresetKey; _count: { owners: number };
}

interface PremiumUser { id: string; username: string | null; displayName: string | null; name: string | null; email: string; premium: boolean; }
interface PremiumDetail extends PremiumUser { premiumEntitlements: Array<{ id: string; tier: "PREMIUM"; startsAt: string; expiresAt: string | null; revokedAt: string | null; reason: string | null; }>; }

type Form = Omit<AdminCosmetic, "id" | "_count">;
const blankForm: Form = { slug: "", type: "AVATAR_FRAME", rarity: "COMMON", name: "", description: "", nameEn: "", descriptionEn: "", price: 0, premiumOnly: false, active: true, visualPreset: "BRONZE_FRAME" };

function textInputClass() { return "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20"; }

export default function AdminCosmeticsManager({ initialCosmetics }: { initialCosmetics: AdminCosmetic[] }) {
  const t = useTranslations("AdminCosmetics");
  const tCosmetics = useTranslations("Cosmetics");
  const locale = useLocale();
  const [cosmetics, setCosmetics] = useState(initialCosmetics);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(blankForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<PremiumUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<PremiumDetail | null>(null);
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const presets = useMemo(
    () => (Object.entries(COSMETIC_PRESETS).filter(([, value]) => value.type === form.type).map(([key]) => key as CosmeticVisualPresetKey)),
    [form.type],
  );

  function update<K extends keyof Form>(key: K, value: Form[K]) { setForm((current) => ({ ...current, [key]: value })); }

  function startEdit(cosmetic: AdminCosmetic) {
    setEditingId(cosmetic.id);
    setForm({
      slug: cosmetic.slug,
      type: cosmetic.type,
      rarity: cosmetic.rarity,
      name: cosmetic.name,
      description: cosmetic.description,
      nameEn: cosmetic.nameEn,
      descriptionEn: cosmetic.descriptionEn,
      price: cosmetic.price,
      premiumOnly: cosmetic.premiumOnly,
      active: cosmetic.active,
      visualPreset: cosmetic.visualPreset,
    });
    setError("");
  }

  function resetForm() { setEditingId(null); setForm(blankForm); setError(""); }

  async function save() {
    setBusy(true); setError("");
    try {
      const response = await fetch(editingId ? `/api/admin/cosmetics/${editingId}` : "/api/admin/cosmetics", {
        method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t("saveError"));
      const saved = payload.cosmetic as AdminCosmetic;
      setCosmetics((current) => editingId ? current.map((cosmetic) => cosmetic.id === editingId ? { ...saved, _count: cosmetic._count } : cosmetic) : [ { ...saved, _count: { owners: 0 } }, ...current ]);
      resetForm();
    } catch (caught) { setError(caught instanceof Error ? caught.message : t("saveError")); } finally { setBusy(false); }
  }

  async function patchCosmetic(cosmetic: AdminCosmetic, patch: Partial<Form>) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/cosmetics/${cosmetic.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t("saveError"));
      setCosmetics((current) => current.map((item) => item.id === cosmetic.id ? { ...payload.cosmetic, _count: item._count } : item));
    } catch (caught) { setError(caught instanceof Error ? caught.message : t("saveError")); } finally { setBusy(false); }
  }

  async function remove(cosmetic: AdminCosmetic) {
    if (!window.confirm(t("deleteConfirm"))) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/cosmetics/${cosmetic.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t("deleteError"));
      setCosmetics((current) => current.filter((item) => item.id !== cosmetic.id));
      if (editingId === cosmetic.id) resetForm();
    } catch (caught) { setError(caught instanceof Error ? caught.message : t("deleteError")); } finally { setBusy(false); }
  }

  async function searchUsers() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/premium?query=${encodeURIComponent(query.trim())}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t("searchError"));
      setUsers(payload.users || []);
    } catch (caught) { setError(caught instanceof Error ? caught.message : t("searchError")); } finally { setBusy(false); }
  }

  async function selectUser(user: PremiumUser) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/premium/${user.id}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t("searchError"));
      setSelectedUser(payload); setReason(""); setExpiresAt("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : t("searchError")); } finally { setBusy(false); }
  }

  async function premiumAction(action: "grant" | "revoke", entitlementId?: string) {
    if (!selectedUser) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/premium/${selectedUser.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, entitlementId, reason, expiresAt: expiresAt || null }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t("premiumError"));
      await selectUser(selectedUser);
    } catch (caught) { setError(caught instanceof Error ? caught.message : t("premiumError")); } finally { setBusy(false); }
  }

  return <div className="space-y-8">
    {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_25rem]">
      <div className="rounded-2xl border border-primary/10 bg-card/20 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4"><div><h2 className="font-display text-lg font-semibold text-foreground">{t("catalogTitle")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("catalogDescription")}</p></div><Button size="sm" variant="outline" onClick={resetForm}>{t("new")}</Button></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {cosmetics.map((cosmetic) => <article key={cosmetic.id} className="rounded-xl border border-border bg-background/50 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-foreground">{locale === "en" ? cosmetic.nameEn : cosmetic.name}</h3><p className="mt-1 text-xs text-muted-foreground">{tCosmetics(`types.${cosmetic.type}`)} · {tCosmetics(`rarities.${cosmetic.rarity}`)}</p></div><span className="size-3 rounded-full" style={{ background: COSMETIC_PRESETS[cosmetic.visualPreset].preview }} aria-label={t("visualPreset")} /></div><p className="mt-3 text-xs text-muted-foreground">{new Intl.NumberFormat(locale).format(cosmetic.price)} TFL · {t("owners", { count: cosmetic._count.owners })}</p><div className="mt-4 flex flex-wrap gap-2"><Button size="xs" variant="outline" disabled={busy} onClick={() => startEdit(cosmetic)}>{t("edit")}</Button><Button size="xs" variant="outline" disabled={busy} onClick={() => void patchCosmetic(cosmetic, { active: !cosmetic.active })}>{cosmetic.active ? t("deactivate") : t("activate")}</Button>{cosmetic._count.owners === 0 && <Button size="icon-xs" variant="destructive" aria-label={t("delete")} title={t("delete")} disabled={busy} onClick={() => void remove(cosmetic)}><Trash2 className="size-3" aria-hidden="true" /></Button>}</div></article>)}
          {cosmetics.length === 0 && <p className="py-8 text-sm text-muted-foreground">{t("catalogEmpty")}</p>}
        </div>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); void save(); }} className="h-fit rounded-2xl border border-primary/15 bg-primary/5 p-5"><div className="flex items-center gap-2 text-primary"><Palette className="size-4" aria-hidden="true" /><h2 className="font-display text-sm font-semibold uppercase tracking-wide">{editingId ? t("editTitle") : t("createTitle")}</h2></div><div className="mt-4 space-y-3"><label className="block text-sm">{t("slug")}<input required value={form.slug} onChange={(event) => update("slug", event.target.value)} className={textInputClass()} /></label><div className="grid grid-cols-2 gap-3"><label className="text-sm">{t("type")}<select value={form.type} onChange={(event) => { const type = event.target.value as CosmeticTypeKey; update("type", type); update("visualPreset", Object.entries(COSMETIC_PRESETS).find(([, preset]) => preset.type === type)?.[0] as CosmeticVisualPresetKey); }} className={textInputClass()}>{COSMETIC_TYPES.map((value) => <option key={value} value={value}>{tCosmetics(`types.${value}`)}</option>)}</select></label><label className="text-sm">{t("rarity")}<select value={form.rarity} onChange={(event) => update("rarity", event.target.value as Form["rarity"])} className={textInputClass()}>{COSMETIC_RARITIES.map((value) => <option key={value} value={value}>{tCosmetics(`rarities.${value}`)}</option>)}</select></label></div><label className="block text-sm">{t("visualPreset")}<select value={form.visualPreset} onChange={(event) => update("visualPreset", event.target.value as CosmeticVisualPresetKey)} className={textInputClass()}>{presets.map((value) => <option key={value} value={value}>{tCosmetics(`presets.${value}`)}</option>)}</select></label><label className="block text-sm">{t("price")}<input required type="number" min={0} max={100000} value={form.price} onChange={(event) => update("price", Number(event.target.value))} className={textInputClass()} /></label><label className="block text-sm">{t("nameEs")}<input required value={form.name} onChange={(event) => update("name", event.target.value)} className={textInputClass()} /></label><label className="block text-sm">{t("descriptionEs")}<textarea required rows={2} value={form.description} onChange={(event) => update("description", event.target.value)} className={textInputClass()} /></label><label className="block text-sm">{t("nameEn")}<input required value={form.nameEn} onChange={(event) => update("nameEn", event.target.value)} className={textInputClass()} /></label><label className="block text-sm">{t("descriptionEn")}<textarea required rows={2} value={form.descriptionEn} onChange={(event) => update("descriptionEn", event.target.value)} className={textInputClass()} /></label><label className="flex items-center justify-between gap-3 text-sm"><span>{t("premiumOnly")}</span><input type="checkbox" checked={form.premiumOnly} onChange={(event) => update("premiumOnly", event.target.checked)} /></label><label className="flex items-center justify-between gap-3 text-sm"><span>{t("active")}</span><input type="checkbox" checked={form.active} onChange={(event) => update("active", event.target.checked)} /></label></div><Button type="submit" className="mt-5 w-full" disabled={busy}>{busy ? t("saving") : t("save")}</Button></form>
    </section>
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_25rem]">
      <div className="rounded-2xl border border-amber-400/20 bg-card/20 p-5 sm:p-6"><div className="flex items-center gap-2"><Crown className="size-4 text-amber-600 dark:text-amber-300" aria-hidden="true" /><div><h2 className="font-display text-lg font-semibold text-foreground">{t("premiumTitle")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("premiumDescription")}</p></div></div><label className="mt-5 block text-sm">{t("searchUser")}<div className="mt-1 flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void searchUsers()} className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary/50" /><Button type="button" size="sm" onClick={() => void searchUsers()} disabled={busy}><Search className="size-3.5" aria-hidden="true" />{t("search")}</Button></div></label>{users.length > 0 && <div className="mt-4 divide-y divide-border rounded-xl border border-border">{users.map((user) => <button key={user.id} type="button" onClick={() => void selectUser(user)} className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left hover:bg-primary/5"><span className="min-w-0"><span className="block truncate text-sm font-medium text-foreground">{user.displayName || user.name || user.username || user.email}</span><span className="block truncate text-xs text-muted-foreground">{user.username ? `@${user.username}` : user.email}</span></span>{user.premium && <Crown className="size-4 shrink-0 text-amber-500" aria-label={t("premiumActive")} />}</button>)}</div>}</div>
      {selectedUser && <aside className="h-fit rounded-2xl border border-amber-400/25 bg-amber-400/5 p-5"><h2 className="font-display text-base font-semibold text-foreground">{selectedUser.displayName || selectedUser.name || selectedUser.username || selectedUser.email}</h2><p className="mt-1 text-sm text-muted-foreground">{selectedUser.premium ? t("premiumActive") : t("premiumInactive")}</p><label className="mt-4 block text-sm">{t("reason")}<textarea required rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} className={textInputClass()} /></label><label className="mt-3 block text-sm">{t("expiresAt")}<input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} className={textInputClass()} /></label><Button className="mt-4 w-full" disabled={busy || !reason.trim() || selectedUser.premium} onClick={() => void premiumAction("grant")}>{t("grantPremium")}</Button><div className="mt-5 space-y-2">{selectedUser.premiumEntitlements.map((entitlement) => <div key={entitlement.id} className="rounded-xl border border-border bg-background/60 p-3 text-xs text-muted-foreground"><p>{entitlement.revokedAt ? t("revoked") : entitlement.expiresAt ? t("expires", { date: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(entitlement.expiresAt)) }) : t("noExpiry")}</p>{!entitlement.revokedAt && <Button className="mt-2" size="xs" variant="destructive" disabled={busy || !reason.trim()} onClick={() => void premiumAction("revoke", entitlement.id)}>{t("revokePremium")}</Button>}</div>)}</div></aside>}
    </section>
  </div>;
}
