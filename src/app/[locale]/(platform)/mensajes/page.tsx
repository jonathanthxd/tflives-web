"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

interface PersonSummary {
  id: string;
  username: string | null;
  displayName: string | null;
  name: string | null;
  image: string | null;
}

function displayNameOf(person: PersonSummary) {
  return person.displayName || person.name || person.username || "Usuario";
}

function Avatar({ person }: { person: PersonSummary }) {
  const name = displayNameOf(person);
  return person.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={person.image} alt={name} className="w-10 h-10 rounded-full object-cover" />
  ) : (
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
      {(name[0] || "U").toUpperCase()}
    </div>
  );
}

export default function MessagesPage() {
  const t = useTranslations("MessagesPage");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<PersonSummary[]>([]);
  const [active, setActive] = useState<PersonSummary | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/social/friends");
      if (res.status === 401) {
        router.replace("/login?redirect=/mensajes");
        return;
      }
      const data = await res.json();
      setFriends(data.friends ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6">{t("titulo")}</h1>

        <Card className="grid grid-cols-1 sm:grid-cols-3 overflow-hidden min-h-[420px]">
          <div className="sm:border-r border-border sm:col-span-1">
            {friends.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">{t("sinAmigos")}</p>
                <Link href="/amigos">
                  <Button size="sm" variant="outline">
                    {t("irAAmigos")}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => setActive(friend)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                      active?.id === friend.id ? "bg-primary/5" : "hover:bg-primary/5"
                    }`}
                  >
                    <Avatar person={friend} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{displayNameOf(friend)}</p>
                      {friend.username && (
                        <p className="text-xs text-muted-foreground truncate">@{friend.username}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sm:col-span-2 flex flex-col items-center justify-center p-8 text-center">
            {active ? (
              <>
                <Avatar person={active} />
                <p className="mt-3 font-display text-lg font-semibold text-foreground">
                  {t("proximamente")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {displayNameOf(active)} — {t("descripcion")}
                </p>
              </>
            ) : (
              friends.length > 0 && <p className="text-sm text-muted-foreground">{t("elegiAmigo")}</p>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
