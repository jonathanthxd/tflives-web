"use client";

import { readJsonResponse } from "@/shared/lib/http";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { UserAvatar } from "@/modules/profiles/components/user-identity";

interface PersonSummary {
  id: string;
  username: string | null;
  displayName: string | null;
  name: string | null;
  image: string | null;
}

interface RequestItem {
  friendshipId: string;
  user: PersonSummary | null;
}

function displayNameOf(person: PersonSummary) {
  return person.displayName || person.name || person.username || "Usuario";
}

function PersonRow({ person, children }: { person: PersonSummary; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2.5">
      <Link
        href={person.username ? `/perfil/${person.username}` : "#"}
        className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
      >
        <UserAvatar identity={person} className="size-10 text-sm" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{displayNameOf(person)}</p>
          {person.username && <p className="text-xs text-muted-foreground truncate">@{person.username}</p>}
        </div>
      </Link>
      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
  );
}

export default function FriendsPage() {
  const t = useTranslations("FriendsPage");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<PersonSummary[]>([]);
  const [received, setReceived] = useState<RequestItem[]>([]);
  const [sent, setSent] = useState<RequestItem[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentUsernames, setSentUsernames] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  async function loadOverview() {
    return fetch("/api/social/friends").then(async (res) => {
      if (res.status === 401) {
        router.replace("/login?redirect=/amigos");
        return;
      }
      const data = await readJsonResponse(res);
      setFriends(data.friends ?? []);
      setReceived(data.received ?? []);
      setSent(data.sent ?? []);
      setLoading(false);
    }).catch(() => { setError(t("errorGenerico")); setLoading(false); });
  }

  useEffect(() => {
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }
    const handle = setTimeout(() => {
      fetch(`/api/social/search?q=${encodeURIComponent(query)}`)
        .then(readJsonResponse)
        .then((data) => setResults(data.results ?? []))
        .catch(() => setError(t("errorGenerico")))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  async function openConversation(username: string) {
    try {
    setError("");
    const res = await fetch("/api/messaging/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || t("errorGenerico"));
      return;
    }
    router.push(`/mensajes?c=${data.conversation.id}`);
  
    } catch { setError(t("errorGenerico")); setLoading(false); }
  }

  async function sendRequest(username: string) {
    try {
    setError("");
    const res = await fetch("/api/social/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (res.ok) {
      setSentUsernames((prev) => new Set(prev).add(username));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t("errorGenerico"));
    }
    loadOverview();
  
    } catch { setError(t("errorGenerico")); setLoading(false); }
  }

  async function respond(friendshipId: string, action: "accept" | "decline") {
    try {
    setError("");
    const res = await fetch("/api/social/friends", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendshipId, action }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t("errorGenerico"));
    }
    loadOverview();
  
    } catch { setError(t("errorGenerico")); setLoading(false); }
  }

  async function cancelRequest(friendshipId: string) {
    try {
    setError("");
    const res = await fetch("/api/social/friends", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendshipId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t("errorGenerico"));
    }
    loadOverview();
  
    } catch { setError(t("errorGenerico")); setLoading(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">{t("titulo")}</h1>

        {error && (
          <div role="alert" className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
            {error}
          </div>
        )}

        <Card className="p-6">
          <Input
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              setSearching(value.trim().length >= 2);
              if (value.trim().length < 2) setResults([]);
            }}
            placeholder={t("buscarPlaceholder")}
          />

          {query.trim().length >= 2 && (
            <div className="mt-4">
              <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide mb-2">
                {t("resultados")}
              </h2>
              {searching ? (
                <div className="py-4 flex justify-center">
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : results.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">{t("sinResultados")}</p>
              ) : (
                <div className="divide-y divide-border">
                  {results.map((person) => (
                    <PersonRow key={person.id} person={person}>
                      <Button
                        size="sm"
                        variant={person.username && sentUsernames.has(person.username) ? "outline" : "default"}
                        disabled={!!person.username && sentUsernames.has(person.username)}
                        onClick={() => person.username && sendRequest(person.username)}
                      >
                        {person.username && sentUsernames.has(person.username) ? t("solicitudEnviada") : t("agregar")}
                      </Button>
                    </PersonRow>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {received.length > 0 && (
          <Card className="p-6">
            <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide mb-2">
              {t("solicitudesRecibidas")}
            </h2>
            <div className="divide-y divide-border">
              {received.map(
                (r) =>
                  r.user && (
                    <PersonRow key={r.friendshipId} person={r.user}>
                      <Button size="sm" onClick={() => respond(r.friendshipId, "accept")}>
                        {t("aceptar")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => respond(r.friendshipId, "decline")}>
                        {t("rechazar")}
                      </Button>
                    </PersonRow>
                  )
              )}
            </div>
          </Card>
        )}

        {sent.length > 0 && (
          <Card className="p-6">
            <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide mb-2">
              {t("solicitudesEnviadas")}
            </h2>
            <div className="divide-y divide-border">
              {sent.map(
                (r) =>
                  r.user && (
                    <PersonRow key={r.friendshipId} person={r.user}>
                      <Button size="sm" variant="outline" onClick={() => cancelRequest(r.friendshipId)}>
                        {t("cancelar")}
                      </Button>
                    </PersonRow>
                  )
              )}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide mb-2">
            {t("tusAmigos")}
          </h2>
          {friends.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">{t("sinAmigos")}</p>
          ) : (
            <div className="divide-y divide-border">
              {friends.map((friend) => (
                <PersonRow key={friend.id} person={friend}>
                  <button
                    onClick={() => friend.username && openConversation(friend.username)}
                    title={t("mensaje")}
                    className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                  </button>
                </PersonRow>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
