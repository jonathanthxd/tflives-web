"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Ban, Coins, Heart, MessageCircle, UserPlus2, Users, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { UserIdentityCompact } from "@/modules/profiles/components/user-identity";
import type { PublicIdentity } from "@/modules/profiles/types";
import { Button } from "@/shared/ui/button";
import ConfirmDialog from "@/shared/ui/confirm-dialog";

type FriendshipStatus = "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "FRIENDS";

interface SocialStatus {
  friendship: { status: FriendshipStatus; friendshipId?: string };
  isFollowing: boolean;
  friendCount: number;
  followerCount: number;
  isOwner: boolean;
  canAct: boolean;
  allowFriendRequests: boolean;
  blockedByViewer: boolean;
  blockedByTarget: boolean;
  canViewFriendsList: boolean;
  friends: PublicIdentity[];
  followers: PublicIdentity[];
}

interface LikeStatus {
  count: number;
  liked: boolean;
  canLike: boolean;
  likers: PublicIdentity[];
}

type PeopleList = "friends" | "followers" | "likes" | null;

function PeopleDialog({
  open,
  title,
  emptyLabel,
  people,
  onClose,
}: {
  open: boolean;
  title: string;
  emptyLabel: string;
  people: PublicIdentity[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-full max-w-md overflow-visible border-0 bg-transparent p-4 backdrop:bg-black/55 backdrop:backdrop-blur-sm"
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            aria-label={title}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="max-h-[min(60vh,28rem)] overflow-y-auto p-3">
          {people.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>
          ) : (
            <div className="space-y-1">
              {people.map((person) => (
                <div key={person.id} onClick={onClose} className="rounded-xl px-3 py-2.5 transition hover:bg-muted/50">
                  <UserIdentityCompact identity={person} avatarClassName="size-10 text-sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}

export default function SocialCard({
  username,
  coinBalance,
}: {
  username: string;
  coinBalance: number;
}) {
  const t = useTranslations("ProfilePlaceholders");
  const locale = useLocale();
  const router = useRouter();
  const [status, setStatus] = useState<SocialStatus | null>(null);
  const [likeStatus, setLikeStatus] = useState<LikeStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [confirmingBlock, setConfirmingBlock] = useState(false);
  const [peopleList, setPeopleList] = useState<PeopleList>(null);

  async function load() {
    const [socialResponse, likeResponse] = await Promise.all([
      fetch(`/api/social/status?username=${encodeURIComponent(username)}`, { cache: "no-store" }),
      fetch(`/api/profile/like?username=${encodeURIComponent(username)}`, { cache: "no-store" }),
    ]);
    if (socialResponse.ok) setStatus(await socialResponse.json());
    if (likeResponse.ok) setLikeStatus(await likeResponse.json());
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  async function request(path: string, method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || t("errorGenerico"));
        return false;
      }
      return true;
    } catch {
      setError(t("errorGenerico"));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function sendRequest() {
    await request("/api/social/friends", "POST", { username });
    await load();
  }

  async function respond(action: "accept" | "decline") {
    if (!status?.friendship.friendshipId) return;
    await request("/api/social/friends", "PATCH", { friendshipId: status.friendship.friendshipId, action });
    await load();
  }

  async function removeFriend() {
    const completed = await request("/api/social/friends", "DELETE", { username });
    if (completed) setConfirmingRemove(false);
    await load();
  }

  async function openConversation() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/messaging/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.conversation?.id) {
        setError(data.error || t("errorGenerico"));
        return;
      }
      router.push(`/mensajes?c=${data.conversation.id}`);
    } catch {
      setError(t("errorGenerico"));
    } finally {
      setBusy(false);
    }
  }

  async function toggleFollow() {
    await request("/api/social/follow", status?.isFollowing ? "DELETE" : "POST", { username });
    await load();
  }

  async function toggleProfileLike() {
    if (!likeStatus?.canLike || busy) return;
    setBusy(true);
    setError("");
    const previous = likeStatus;
    setLikeStatus({
      ...previous,
      liked: !previous.liked,
      count: Math.max(0, previous.count + (previous.liked ? -1 : 1)),
    });
    try {
      const response = await fetch("/api/profile/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setLikeStatus(previous);
        setError(data.error || t("errorGenerico"));
        return;
      }
      setLikeStatus((current) => current ? { ...current, liked: Boolean(data.liked), count: Number(data.count) || 0 } : current);
    } catch {
      setLikeStatus(previous);
      setError(t("errorGenerico"));
    } finally {
      setBusy(false);
    }
  }

  async function toggleBlock() {
    if (!status) return;
    const completed = await request("/api/messaging/block", status.blockedByViewer ? "DELETE" : "POST", { username });
    if (completed) {
      setConfirmingBlock(false);
      await load();
      router.refresh();
    }
  }

  const people = useMemo(() => {
    if (peopleList === "friends") return status?.friends ?? [];
    if (peopleList === "followers") return status?.followers ?? [];
    if (peopleList === "likes") return likeStatus?.likers ?? [];
    return [];
  }, [peopleList, status?.friends, status?.followers, likeStatus?.likers]);

  const dialogTitle = peopleList === "friends"
    ? t("amigos")
    : peopleList === "followers"
      ? t("seguidores")
      : t("likesPerfil");
  const emptyLabel = peopleList === "friends"
    ? t("sinAmigos")
    : peopleList === "followers"
      ? t("sinSeguidores")
      : t("sinLikesPerfil");

  const formatter = new Intl.NumberFormat(locale === "es" ? "es-CO" : "en-US");

  function Metric({
    label,
    value,
    icon,
    onClick,
  }: {
    label: string;
    value: string | number;
    icon?: ReactNode;
    onClick?: () => void;
  }) {
    const content = (
      <>
        {icon}
        <span className="font-display text-base font-bold text-foreground sm:text-lg">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </>
    );
    const className = "inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/70 bg-background/35 px-3 py-2 text-left transition";
    return onClick ? (
      <button type="button" onClick={onClick} className={`${className} hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}>
        {content}
      </button>
    ) : (
      <div className={className}>{content}</div>
    );
  }

  return (
    <div className="mt-5 border-t border-border/70 pt-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          <Metric
            label={t("amigos")}
            value={status?.friendCount ?? "—"}
            icon={<Users className="size-4 text-primary" aria-hidden="true" />}
            onClick={status?.canViewFriendsList ? () => setPeopleList("friends") : undefined}
          />
          <Metric
            label={t("seguidores")}
            value={status?.followerCount ?? "—"}
            onClick={status?.isOwner ? () => setPeopleList("followers") : undefined}
          />
          <Metric
            label={t("likesPerfil")}
            value={likeStatus?.count ?? "—"}
            icon={<Heart className="size-4 text-rose-500" aria-hidden="true" />}
            onClick={status?.isOwner ? () => setPeopleList("likes") : undefined}
          />
          <Metric
            label={t("tflCoins")}
            value={formatter.format(coinBalance)}
            icon={<Coins className="size-4 text-amber-500" aria-hidden="true" />}
          />
        </div>

        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}

        {status && !status.isOwner && status.canAct && (
          <div className="flex flex-wrap gap-2">
            {status.blockedByTarget ? (
              <p className="text-sm text-muted-foreground">{t("accionesNoDisponibles")}</p>
            ) : status.blockedByViewer ? (
              <Button size="sm" variant="outline" onClick={toggleBlock} disabled={busy}>
                <Ban className="size-3.5" data-icon="inline-start" />{t("desbloquear")}
              </Button>
            ) : (
              <>
                {status.friendship.status === "NONE" && status.allowFriendRequests && (
                  <Button size="sm" onClick={sendRequest} disabled={busy}><UserPlus2 className="size-3.5" data-icon="inline-start" />{t("agregarAmigo")}</Button>
                )}
                {status.friendship.status === "PENDING_SENT" && <Button size="sm" variant="outline" disabled>{t("solicitudEnviada")}</Button>}
                {status.friendship.status === "PENDING_RECEIVED" && (
                  <>
                    <Button size="sm" onClick={() => void respond("accept")} disabled={busy}>{t("aceptarSolicitud")}</Button>
                    <Button size="sm" variant="ghost" onClick={() => void respond("decline")} disabled={busy}>{t("rechazar")}</Button>
                  </>
                )}
                {status.friendship.status === "FRIENDS" && (
                  <Button size="sm" variant="outline" onClick={() => setConfirmingRemove(true)} disabled={busy}>{t("eliminarAmigo")}</Button>
                )}
                <Button size="sm" variant="ghost" onClick={openConversation} disabled={busy}><MessageCircle className="size-3.5" data-icon="inline-start" />{t("mensaje")}</Button>
                <Button size="sm" variant={status.isFollowing ? "outline" : "default"} onClick={toggleFollow} disabled={busy}>{status.isFollowing ? t("dejarDeSeguir") : t("seguir")}</Button>
                {likeStatus?.canLike && (
                  <Button size="sm" variant={likeStatus.liked ? "outline" : "ghost"} onClick={toggleProfileLike} disabled={busy} className={likeStatus.liked ? "border-rose-500/30 text-rose-500" : ""}>
                    <Heart className="size-3.5" fill={likeStatus.liked ? "currentColor" : "none"} data-icon="inline-start" />
                    {likeStatus.liked ? t("teGusta") : t("darLikePerfil")}
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setConfirmingBlock(true)} disabled={busy} className="text-destructive hover:text-destructive"><Ban className="size-3.5" data-icon="inline-start" />{t("bloquear")}</Button>
              </>
            )}
          </div>
        )}
      </div>

      <PeopleDialog open={peopleList !== null} title={dialogTitle} emptyLabel={emptyLabel} people={people} onClose={() => setPeopleList(null)} />
      <ConfirmDialog open={confirmingRemove} title={t("confirmarEliminarTitulo")} description={t("confirmarEliminarDescripcion")} confirmLabel={t("eliminarAmigo")} cancelLabel={t("cancelar")} onConfirm={removeFriend} onCancel={() => setConfirmingRemove(false)} busy={busy} />
      <ConfirmDialog open={confirmingBlock} title={t("confirmarBloqueoTitulo")} description={t("confirmarBloqueoDescripcion")} confirmLabel={t("bloquear")} cancelLabel={t("cancelar")} onConfirm={toggleBlock} onCancel={() => setConfirmingBlock(false)} busy={busy} />
    </div>
  );
}
