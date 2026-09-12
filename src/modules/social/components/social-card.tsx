"use client";

import { useEffect, useState } from "react";
import { Ban, MessageCircle, UserPlus2, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
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
}

export default function SocialCard({ username }: { username: string }) {
  const t = useTranslations("ProfilePlaceholders");
  const router = useRouter();
  const [status, setStatus] = useState<SocialStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [confirmingBlock, setConfirmingBlock] = useState(false);

  async function load() {
    const response = await fetch(`/api/social/status?username=${encodeURIComponent(username)}`);
    if (response.ok) setStatus(await response.json());
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

  async function toggleBlock() {
    if (!status) return;
    const completed = await request("/api/messaging/block", status.blockedByViewer ? "DELETE" : "POST", { username });
    if (completed) {
      setConfirmingBlock(false);
      await load();
      router.refresh();
    }
  }

  return (
    <Card className="relative h-full overflow-hidden p-6">
      <div aria-hidden className="absolute -right-8 -top-8 size-28 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative mb-5 flex items-center gap-2">
        <Users className="size-4 text-primary" strokeWidth={1.75} />
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">{t("comunidad")}</h2>
      </div>
      <div className="relative mb-5 flex gap-8 text-sm">
        <div><p className="font-display text-2xl font-bold text-foreground">{status?.friendCount ?? 0}</p><p className="text-muted-foreground">{t("amigos")}</p></div>
        <div><p className="font-display text-2xl font-bold text-foreground">{status?.followerCount ?? 0}</p><p className="text-muted-foreground">{t("seguidores")}</p></div>
      </div>

      {error && <p role="alert" className="relative mb-3 text-xs text-destructive">{error}</p>}

      {status && !status.isOwner && status.canAct && (
        <div className="relative flex flex-wrap gap-2">
          {status.blockedByTarget ? (
            <p className="text-sm text-muted-foreground">{t("accionesNoDisponibles")}</p>
          ) : status.blockedByViewer ? (
            <Button size="sm" variant="outline" onClick={toggleBlock} disabled={busy}><Ban className="size-3.5" data-icon="inline-start" />{t("desbloquear")}</Button>
          ) : (
            <>
              {status.friendship.status === "NONE" && status.allowFriendRequests && <Button size="sm" onClick={sendRequest} disabled={busy}><UserPlus2 className="size-3.5" data-icon="inline-start" />{t("agregarAmigo")}</Button>}
              {status.friendship.status === "PENDING_SENT" && <Button size="sm" variant="outline" disabled>{t("solicitudEnviada")}</Button>}
              {status.friendship.status === "PENDING_RECEIVED" && <><Button size="sm" onClick={() => void respond("accept")} disabled={busy}>{t("aceptarSolicitud")}</Button><Button size="sm" variant="ghost" onClick={() => void respond("decline")} disabled={busy}>{t("rechazar")}</Button></>}
              {status.friendship.status === "FRIENDS" && <Button size="sm" variant="outline" onClick={() => setConfirmingRemove(true)} disabled={busy}>{t("eliminarAmigo")}</Button>}
              <Button size="sm" variant="ghost" onClick={openConversation} disabled={busy}><MessageCircle className="size-3.5" data-icon="inline-start" />{t("mensaje")}</Button>
              <Button size="sm" variant={status.isFollowing ? "outline" : "default"} onClick={toggleFollow} disabled={busy}>{status.isFollowing ? t("dejarDeSeguir") : t("seguir")}</Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmingBlock(true)} disabled={busy} className="text-destructive hover:text-destructive"><Ban className="size-3.5" data-icon="inline-start" />{t("bloquear")}</Button>
            </>
          )}
        </div>
      )}

      <ConfirmDialog open={confirmingRemove} title={t("confirmarEliminarTitulo")} description={t("confirmarEliminarDescripcion")} confirmLabel={t("eliminarAmigo")} cancelLabel={t("cancelar")} onConfirm={removeFriend} onCancel={() => setConfirmingRemove(false)} busy={busy} />
      <ConfirmDialog open={confirmingBlock} title={t("confirmarBloqueoTitulo")} description={t("confirmarBloqueoDescripcion")} confirmLabel={t("bloquear")} cancelLabel={t("cancelar")} onConfirm={toggleBlock} onCancel={() => setConfirmingBlock(false)} busy={busy} />
    </Card>
  );
}
