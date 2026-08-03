"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

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
  const [status, setStatus] = useState<SocialStatus | null>(null);
  const [busy, setBusy] = useState(false);

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
    await fetch("/api/social/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    await load();
    setBusy(false);
  }

  async function respond(action: "accept" | "decline") {
    if (!status?.friendship.friendshipId) return;
    setBusy(true);
    await fetch("/api/social/friends", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendshipId: status.friendship.friendshipId, action }),
    });
    await load();
    setBusy(false);
  }

  async function removeFriend() {
    setBusy(true);
    await fetch("/api/social/friends", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    await load();
    setBusy(false);
  }

  async function toggleFollow() {
    setBusy(true);
    await fetch("/api/social/follow", {
      method: status?.isFollowing ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    await load();
    setBusy(false);
  }

  return (
    <Card className="p-6 h-full">
      <div className="mb-4">
        <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">
          {t("comunidad")}
        </h2>
      </div>
      <div className="flex gap-6 text-sm mb-4">
        <div>
          <p className="text-lg font-bold text-foreground">{status?.friendCount ?? 0}</p>
          <p className="text-muted-foreground">{t("amigos")}</p>
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">{status?.followerCount ?? 0}</p>
          <p className="text-muted-foreground">{t("seguidores")}</p>
        </div>
      </div>

      {status && !status.isOwner && (
        <div className="flex flex-wrap gap-2">
          {status.friendship.status === "NONE" && (
            <Button size="sm" onClick={sendRequest} disabled={busy}>
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
              <Button size="sm" variant="outline" onClick={removeFriend} disabled={busy}>
                {t("sonAmigos")}
              </Button>
              <Link href="/mensajes">
                <Button size="sm" variant="ghost">
                  {t("mensaje")}
                </Button>
              </Link>
            </>
          )}
          <Button size="sm" variant={status.isFollowing ? "outline" : "default"} onClick={toggleFollow} disabled={busy}>
            {status.isFollowing ? t("dejarDeSeguir") : t("seguir")}
          </Button>
        </div>
      )}
    </Card>
  );
}
