"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Users, UserPlus2 } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import ConfirmDialog from "@/shared/ui/confirm-dialog";

type FriendshipStatus = "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "FRIENDS";

interface SocialStatus {
  friendship: { status: FriendshipStatus; friendshipId?: string };
  isFollowing: boolean;
  friendCount: number;
  followerCount: number;
  isOwner: boolean;
}

export default function SocialCard({ username }: { username: string }) {
  const t = useTranslations("ProfilePlaceholders");
  const router = useRouter();
  const [status, setStatus] = useState<SocialStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  async function load() {
    const res = await fetch(`/api/social/status?username=${encodeURIComponent(username)}`);
    if (res.ok) setStatus(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  async function sendRequest() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/social/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t("errorGenerico"));
    }
    await load();
    setBusy(false);
  }

  async function respond(action: "accept" | "decline") {
    if (!status?.friendship.friendshipId) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/social/friends", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendshipId: status.friendship.friendshipId, action }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t("errorGenerico"));
    }
    await load();
    setBusy(false);
  }

  async function removeFriend() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/social/friends", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t("errorGenerico"));
    }
    await load();
    setBusy(false);
    setConfirmingRemove(false);
  }

  async function openConversation() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/messaging/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || t("errorGenerico"));
      return;
    }
    router.push(`/mensajes?c=${data.conversation.id}`);
  }

  async function toggleFollow() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/social/follow", {
      method: status?.isFollowing ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t("errorGenerico"));
    }
    await load();
    setBusy(false);
  }

  return (
    <Card className="p-6 h-full relative overflow-hidden">
      <div aria-hidden className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative mb-5 flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" strokeWidth={1.75} />
        <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">
          {t("comunidad")}
        </h2>
      </div>
      <div className="relative flex gap-8 text-sm mb-5">
        <div>
          <p className="font-display text-2xl font-bold text-foreground">{status?.friendCount ?? 0}</p>
          <p className="text-muted-foreground">{t("amigos")}</p>
        </div>
        <div>
          <p className="font-display text-2xl font-bold text-foreground">{status?.followerCount ?? 0}</p>
          <p className="text-muted-foreground">{t("seguidores")}</p>
        </div>
      </div>

      {error && <p className="text-xs text-destructive mb-2">{error}</p>}

      {status && !status.isOwner && (
        <div className="relative flex flex-wrap gap-2">
          {status.friendship.status === "NONE" && (
            <Button size="sm" onClick={sendRequest} disabled={busy}>
              <UserPlus2 className="h-3.5 w-3.5" strokeWidth={2} data-icon="inline-start" />
              {t("agregarAmigo")}
            </Button>
          )}
          {status.friendship.status === "PENDING_SENT" && (
            <Button size="sm" variant="outline" disabled>
              {t("solicitudEnviada")}
            </Button>
          )}
          {status.friendship.status === "PENDING_RECEIVED" && (
            <>
              <Button size="sm" onClick={() => respond("accept")} disabled={busy}>
                {t("aceptarSolicitud")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => respond("decline")} disabled={busy}>
                {t("rechazar")}
              </Button>
            </>
          )}
          {status.friendship.status === "FRIENDS" && (
            <>
              <Button size="sm" variant="outline" onClick={() => setConfirmingRemove(true)} disabled={busy}>
                {t("eliminarAmigo")}
              </Button>
              <Button size="sm" variant="ghost" onClick={openConversation} disabled={busy}>
                {t("mensaje")}
              </Button>
            </>
          )}
          <Button size="sm" variant={status.isFollowing ? "outline" : "default"} onClick={toggleFollow} disabled={busy}>
            {status.isFollowing ? t("dejarDeSeguir") : t("seguir")}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmingRemove}
        title={t("confirmarEliminarTitulo")}
        description={t("confirmarEliminarDescripcion")}
        confirmLabel={t("eliminarAmigo")}
        cancelLabel={t("cancelar")}
        onConfirm={removeFriend}
        onCancel={() => setConfirmingRemove(false)}
        busy={busy}
      />
    </Card>
  );
}
