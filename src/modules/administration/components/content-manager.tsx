"use client";
import { useState } from "react";
import { useInitialClientValue } from "@/shared/lib/client-value";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/shared/ui/button";
import ConfirmDialog from "@/shared/ui/confirm-dialog";
import { EmptyState } from "./ui/empty-state";
import { StatusBadge } from "./ui/status-badge";
import ContentEditor from "@/modules/editorial/components/content-editor";
import { slugify } from "@/modules/editorial/validation";
import {
  CONTENT_FIELDS,
  CONTENT_ENDPOINTS,
  type ContentKind,
  type Field,
} from "./content-fields";

export type ContentRecord = Record<string, unknown> & { id: string };
type Option = { id: string; name: string };
const inputClass =
  "w-full min-w-0 rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";
function str(value: unknown) {
  return typeof value === "string" ? value : "";
}
function defaultForm(kind: ContentKind): Record<string, unknown> {
  return Object.fromEntries(
    CONTENT_FIELDS[kind].map((f) => [
      f.key,
      f.type === "checkbox"
        ? false
        : f.type === "number"
          ? 0
          : f.type === "tags" || f.type === "links"
            ? []
            : f.key === "locale"
              ? "es"
              : f.key === "status"
                ? "COMING_SOON"
                : (f.options?.[0] ?? ""),
    ]),
  );
}
export default function ContentManager({
  kind,
  initialItems,
  modalities = [],
  categories = [],
  initialEdit,
  createInitially = false,
}: {
  kind: ContentKind;
  initialItems: ContentRecord[];
  modalities?: Option[];
  categories?: Option[];
  initialEdit?: ContentRecord;
  createInitially?: boolean;
}) {
  const t = useTranslations("Content");
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState<Record<string, unknown> | null>(
    initialEdit ?? (createInitially ? defaultForm(kind) : null),
  );
  const [translationLocale, setTranslationLocale] = useState("base");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [archiving, setArchiving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const now = useInitialClientValue<number | null>(() => Date.now(), null);
  const [deleting, setDeleting] = useState<ContentRecord | null>(null);

  const fields = CONTENT_FIELDS[kind];
  const stateOf = (item: Record<string, unknown>) =>
    item.archived || item.status === "ARCHIVED" || item.state === "ARCHIVED"
      ? "ARCHIVED"
      : item.state
        ? str(item.state)
        : item.published &&
            item.scheduledFor &&
            now !== null &&
            new Date(str(item.scheduledFor)).getTime() > now
          ? "SCHEDULED"
          : item.published || item.active
            ? "PUBLISHED"
            : "DRAFT";
  function change(key: string, value: unknown, field?: Field) {
    setSaved(false);
    setForm((previous) => {
      if (!previous) return previous;
      if (translationLocale !== "base" && field?.translated) {
        const translations = (previous.translations ?? {}) as Record<
          string,
          Record<string, unknown>
        >;
        return {
          ...previous,
          translations: {
            ...translations,
            [translationLocale]: {
              ...translations[translationLocale],
              [key]: value,
            },
          },
        };
      }
      const next = { ...previous, [key]: value };
      if ((key === "title" || key === "name") && !previous.id && (!previous.slug || previous.slug === slugify(str(previous[key]))))
        next.slug = slugify(str(value));
      return next;
    });
  }
  function start(item?: ContentRecord) {
    setForm(item ? { ...item } : defaultForm(kind));
    setError("");
    setSaved(false);
    setTranslationLocale("base");
  }
  async function save(event?: React.FormEvent, confirmed = false) {
    event?.preventDefault();
    if (!form) return;
    if (!confirmed && stateOf(form) === "ARCHIVED") {
      setArchiving(true);
      return;
    }
    setArchiving(false);
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const payload = { ...form };
      for (const key of ["tags", "socialLinks"])
        if (Array.isArray(payload[key]))
          payload[key] = [
            ...new Set((payload[key] as string[]).filter(Boolean)),
          ];
      for (const key of ["modalityId", "categoryId", "scheduledFor"])
        if (key in payload)
          payload[key] = payload[key]
            ? key === "scheduledFor"
              ? new Date(str(payload[key])).toISOString()
              : payload[key]
            : null;
      const response = await fetch(
        CONTENT_ENDPOINTS[kind] + (form.id ? `/${form.id}` : ""),
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        const key = [
          "invalid",
          "duplicate",
          "related",
          "missing",
          "forbidden",
          "unauthenticated",
          "teamUserMissing",
          "teamUserDuplicate",
        ].includes(data.error)
          ? data.error
          : "failed";
        setError(t(key));
        return;
      }
      const item = (data.item ?? data.post) as ContentRecord;
      setItems((prev) => [...prev.filter((row) => row.id !== item.id), item]);
      setForm(null);
      setSaved(true);
      router.refresh();
      if (initialEdit || createInitially) router.push(`/admin/${kind}`);
    } catch {
      setError(t("failed"));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `${CONTENT_ENDPOINTS[kind]}/${deleting.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const data = await response.json();
        setError(t(data.error === "related" ? "related" : "failed"));
        return;
      }
      setItems((prev) => prev.filter((row) => row.id !== deleting.id));
      router.refresh();
    } catch {
      setError(t("failed"));
    } finally {
      setDeleting(null);
      setBusy(false);
    }
  }
  const filtered = items.filter(
    (row) =>
      `${row.title ?? row.name} ${row.type ?? ""} ${row.tags ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter === "all" || stateOf(row) === filter),
  );
  return (
    <section className="min-w-0 space-y-5" aria-label={t(kind)}>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-primary">
          {t("saved")}
        </p>
      )}
      {!form && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1 text-sm">
            {t("search")}
            <input
              className={inputClass}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="text-sm">
            {t("state")}
            <select
              className={inputClass}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {["all", "DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"].map(
                (k) => (
                  <option key={k} value={k}>
                    {t(k)}
                  </option>
                ),
              )}
            </select>
          </label>
          <Button onClick={() => start()}>
            <Plus size={16} />
            {t("create")}
          </Button>
        </div>
      )}
      {form && (
        <form
          onSubmit={save}
          className="rounded-2xl border border-primary/20 bg-card/40 p-4 sm:p-7 space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">
              {t(form.id ? "edit" : "create")} · {t(kind)}
            </h2>
            <label className="text-sm">
              {t("translation")}
              <select
                className={inputClass}
                value={translationLocale}
                onChange={(e) => setTranslationLocale(e.target.value)}
              >
                {["base", "es", "en"].map((k) => (
                  <option key={k} value={k}>
                    {t(k)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-sm text-muted-foreground">{t("editorHelp")}</p>
          <div className="grid gap-5 sm:grid-cols-2">
            {fields
              .filter((f) => translationLocale === "base" || f.translated)
              .map((field) => {
                const { key } = field;
                const id = `${kind}-${key}`;
                const raw =
                  translationLocale === "base"
                    ? form[key]
                    : (
                        form.translations as
                          Record<string, Record<string, unknown>> | undefined
                      )?.[translationLocale]?.[key];
                const value = str(raw);
                const options =
                  key === "modalityId"
                    ? modalities
                    : key === "categoryId"
                      ? categories
                      : null;
                return (
                  <div
                    key={key}
                    className={
                      field.type === "markdown" ||
                      field.type === "textarea" ||
                      field.type === "links"
                        ? "sm:col-span-2"
                        : "min-w-0"
                    }
                  >
                    <label
                      htmlFor={id}
                      className="mb-2 block text-sm font-medium text-muted-foreground"
                    >
                      {t(key)}
                      {field.required && translationLocale === "base"
                        ? " *"
                        : ""}
                    </label>
                    {field.type === "markdown" ? (
                      <ContentEditor
                        id={id}
                        value={value}
                        onChange={(v) => change(key, v, field)}
                      />
                    ) : field.type === "checkbox" ? (
                      <input
                        id={id}
                        type="checkbox"
                        checked={!!raw}
                        onChange={(e) => change(key, e.target.checked)}
                        className="h-5 w-5 accent-primary"
                      />
                    ) : field.type === "select" ? (
                      <select
                        id={id}
                        value={value}
                        onChange={(e) => change(key, e.target.value)}
                        className={inputClass}
                      >
                        {options ? (
                          <>
                            <option value="">{t("none")}</option>
                            {options.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name}
                              </option>
                            ))}
                          </>
                        ) : (
                          field.options?.map((option) => (
                            <option key={option} value={option}>
                              {t(option)}
                            </option>
                          ))
                        )}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea
                        id={id}
                        rows={4}
                        value={value}
                        maxLength={100000}
                        required={
                          field.required && translationLocale === "base"
                        }
                        onChange={(e) => change(key, e.target.value, field)}
                        className={inputClass}
                      />
                    ) : kind === "team" && key === "username" ? (
                      <div>
                        <div className="flex min-w-0 items-center rounded-xl border border-border bg-background focus-within:outline focus-within:outline-2 focus-within:outline-primary">
                          <span className="select-none pl-4 text-sm font-semibold text-muted-foreground">@</span>
                          <input
                            id={id}
                            className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm outline-none"
                            required
                            autoComplete="off"
                            spellCheck={false}
                            value={value.replace(/^@/, "")}
                            onChange={(e) => change(key, e.target.value.replace(/^@/, ""), field)}
                          />
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("teamUserHelp")}</p>
                      </div>
                    ) : (
                      <input
                        id={id}
                        className={inputClass}
                        type={
                          field.type === "tags" || field.type === "links"
                            ? "text"
                            : (field.type ?? "text")
                        }
                        required={
                          field.required && translationLocale === "base"
                        }
                        value={
                          field.type === "number"
                            ? Number(raw ?? 0)
                            : Array.isArray(raw)
                              ? raw.join(", ")
                              : field.type === "datetime-local" && value
                                ? new Date(
                                    new Date(value).getTime() -
                                      new Date(value).getTimezoneOffset() *
                                        60000,
                                  )
                                    .toISOString()
                                    .slice(0, 16)
                                : value
                        }
                        onChange={(e) =>
                          change(
                            key,
                            field.type === "number"
                              ? Number(e.target.value)
                              : field.type === "tags" || field.type === "links"
                                ? e.target.value.split(",").map((s) => s.trim())
                                : e.target.value,
                            field,
                          )
                        }
                      />
                    )}
                  </div>
                );
              })}
          </div>
          <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setForm(null);
                if (initialEdit || createInitially)
                  router.push(`/admin/${kind}`);
              }}
            >
              {t("cancel")}
            </Button>
            <Button disabled={busy} type="submit">
              {t(busy ? "saving" : "save")}
            </Button>
          </div>
        </form>
      )}
      {!form &&
        (filtered.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="min-w-0 rounded-2xl border border-primary/10 bg-card/40 p-5"
              >
                <div className="flex flex-wrap gap-2 mb-3">
                  <StatusBadge
                    tone={stateOf(item) === "PUBLISHED" ? "success" : "neutral"}
                  >
                    {t(stateOf(item))}
                  </StatusBadge>
                  {!!item.type && (
                    <span className="text-xs text-primary">
                      {t(str(item.type))}
                    </span>
                  )}
                </div>
                <h3 className="font-display font-semibold break-words">
                  {str(item.title ?? item.name)}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {str(
                    item.excerpt ??
                      item.description ??
                      item.roleTitle ??
                      item.slug,
                  )}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => start(item)}
                  >
                    <Pencil size={14} />
                    {t("edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleting(item)}
                  >
                    <Trash2 size={14} />
                    {t("delete")}
                  </Button>
                  {(kind === "posts" || kind === "wiki") &&
                    stateOf(item) === "PUBLISHED" && (
                      <Link
                        className="self-center text-sm text-primary"
                        href={
                          kind === "wiki"
                            ? `/network/wiki/${item.slug}`
                            : `/network/${item.slug}`
                        }
                      >
                        {t("view")}
                      </Link>
                    )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title={t("empty")}
            description={t("adminEmpty")}
          />
        ))}
      <ConfirmDialog
        open={!!deleting || archiving}
        title={t(archiving ? "ARCHIVED" : "delete")}
        description={t(archiving ? "archiveConfirm" : "deleteConfirm")}
        confirmLabel={t(archiving ? "save" : "delete")}
        cancelLabel={t("cancel")}
        busy={busy}
        onConfirm={() => (archiving ? save(undefined, true) : remove())}
        onCancel={() => {
          setDeleting(null);
          setArchiving(false);
        }}
      />
    </section>
  );
}
