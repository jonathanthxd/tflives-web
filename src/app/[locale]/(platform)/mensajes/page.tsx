"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, Link as IntlLink } from "@/i18n/navigation";
import { useSearchParams as useNextSearchParams } from "next/navigation";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import ConfirmDialog from "@/shared/ui/confirm-dialog";

interface PersonSummary {
  id: string;
  username: string | null;
  displayName: string | null;
  name: string | null;
  image: string | null;
}

interface InboxEntry {
  conversationId: string;
  isGroup: boolean;
  name: string | null;
  status: "ACTIVE" | "PENDING";
  updatedAt: string;
  otherParticipants: PersonSummary[];
  lastMessage: { content: string; senderId: string; createdAt: string } | null;
  unread: boolean;
}

interface ConversationMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface ConversationDetail {
  id: string;
  isGroup: boolean;
  name: string | null;
  participants: { userId: string; role: "OWNER" | "MEMBER"; status: string; user: PersonSummary }[];
  messages: ConversationMessage[];
}

function displayNameOf(person: PersonSummary) {
  return person.displayName || person.name || person.username || "Usuario";
}

function Avatar({ person }: { person: PersonSummary }) {
  const name = displayNameOf(person);
  return person.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={person.image} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0" />
  ) : (
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
      {(name[0] || "U").toUpperCase()}
    </div>
  );
}

function conversationTitle(entry: { isGroup: boolean; name: string | null; otherParticipants: PersonSummary[] }) {
  if (entry.isGroup) return entry.name || "Grupo";
  return displayNameOf(entry.otherParticipants[0] ?? { id: "", username: null, displayName: null, name: null, image: null });
}

export default function MessagesPage() {
  const t = useTranslations("MessagesPage");
  const locale = useLocale();
  const router = useRouter();
  const nextSearchParams = useNextSearchParams();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<InboxEntry[]>([]);
  const [requests, setRequests] = useState<InboxEntry[]>([]);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [showNewMessage, setShowNewMessage] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [newMessageQuery, setNewMessageQuery] = useState("");
  const [newMessageResults, setNewMessageResults] = useState<PersonSummary[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupFriends, setGroupFriends] = useState<PersonSummary[]>([]);
  const [groupSelected, setGroupSelected] = useState<Set<string>>(new Set());
  const [reportReason, setReportReason] = useState("");
  const [busy, setBusy] = useState(false);

  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function loadInbox() {
    const res = await fetch("/api/messaging/conversations");
    if (res.status === 401) {
      router.replace("/login?redirect=/mensajes");
      return;
    }
    const data = await res.json();
    setActive(data.active ?? []);
    setRequests(data.requests ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setMyUserId(data.user?.id ?? null));
    loadInbox();
    setActiveId(nextSearchParams.get("c"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadConversation(id: string) {
    const res = await fetch(`/api/messaging/conversations/${id}`);
    if (res.ok) {
      const data = await res.json();
      setConversation(data.conversation);
    } else {
      setConversation(null);
    }
  }

  useEffect(() => {
    if (activeId) loadConversation(activeId);
    else setConversation(null);
  }, [activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;

    async function refreshConversation() {
      if (cancelled || !activeId) return;
      await Promise.all([loadConversation(activeId), loadInbox()]);
    }

    const interval = window.setInterval(refreshConversation, 2_500);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshConversation();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  function selectConversation(id: string) {
    setActiveId(id);
    router.push(`/mensajes?c=${id}`);
  }

  async function openNewMessage() {
    setNewMessageQuery("");
    setNewMessageResults([]);
    setShowNewMessage(true);
  }

  useEffect(() => {
    if (!showNewMessage || newMessageQuery.trim().length < 2) {
      setNewMessageResults([]);
      return;
    }
    const handle = setTimeout(() => {
      fetch(`/api/social/search?q=${encodeURIComponent(newMessageQuery)}`)
        .then((res) => res.json())
        .then((data) => setNewMessageResults(data.results ?? []));
    }, 300);
    return () => clearTimeout(handle);
  }, [newMessageQuery, showNewMessage]);

  async function startConversation(username: string) {
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
    setShowNewMessage(false);
    await loadInbox();
    selectConversation(data.conversation.id);
  }

  async function openNewGroup() {
    const res = await fetch("/api/social/friends");
    const data = await res.json();
    setGroupFriends(data.friends ?? []);
    setGroupSelected(new Set());
    setGroupName("");
    setShowNewGroup(true);
  }

  function toggleGroupMember(id: string) {
    setGroupSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submitGroup() {
    const usernames = groupFriends
      .filter((f) => groupSelected.has(f.id) && f.username)
      .map((f) => f.username as string);
    if (usernames.length === 0) return;

    setBusy(true);
    setError("");
    const res = await fetch("/api/messaging/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: groupName.trim() || null, usernames }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || t("errorGenerico"));
      return;
    }
    setShowNewGroup(false);
    await loadInbox();
    selectConversation(data.conversation.id);
  }

  async function respondRequest(id: string, action: "open" | "decline") {
    await fetch(`/api/messaging/conversations/${id}/requests`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await loadInbox();
    if (action === "open") selectConversation(id);
  }

  async function sendMessage() {
    if (!activeId || !draft.trim()) return;
    const content = draft;
    setDraft("");
    const res = await fetch(`/api/messaging/conversations/${activeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const data = await res.json();
      setConversation((prev) => {
        if (!prev) return prev;
        if (prev.messages.some((m) => m.id === data.message.id)) return prev;
        return { ...prev, messages: [...prev.messages, data.message] };
      });
      loadInbox();
    }
  }

  async function confirmBlock() {
    if (!conversation) return;
    const other = conversation.participants.find((p) => p.userId !== myUserId)?.user;
    if (!other?.username) return;
    setBusy(true);
    await fetch("/api/messaging/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: other.username }),
    });
    setBusy(false);
    setShowBlockConfirm(false);
    setActiveId(null);
    router.push("/mensajes");
    await loadInbox();
  }

  async function confirmLeave() {
    if (!activeId) return;
    setBusy(true);
    await fetch(`/api/messaging/conversations/${activeId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setBusy(false);
    setShowLeaveConfirm(false);
    setActiveId(null);
    router.push("/mensajes");
    await loadInbox();
  }

  async function submitReport() {
    if (!activeId || !reportReason.trim()) return;
    setBusy(true);
    await fetch("/api/messaging/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "CONVERSATION", targetId: activeId, reason: reportReason }),
    });
    setBusy(false);
    setReportReason("");
    setShowReport(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const otherParticipant = conversation?.participants.find((p) => p.userId !== myUserId)?.user ?? null;

  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">{t("titulo")}</h1>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={openNewGroup}>
              {t("nuevoGrupo")}
            </Button>
            <Button size="sm" onClick={openNewMessage}>
              {t("nuevoMensaje")}
            </Button>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
            {error}
          </div>
        )}

        <Card className="grid grid-cols-1 sm:grid-cols-3 overflow-hidden min-h-[480px]">
          <div className="sm:border-r border-border sm:col-span-1 max-h-[600px] overflow-y-auto">
            {requests.length > 0 && (
              <div className="border-b border-border">
                <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("solicitudesMensaje")}
                </p>
                {requests.map((entry) => (
                  <div key={entry.conversationId} className="flex items-center gap-3 px-4 py-3">
                    <Avatar person={entry.otherParticipants[0] ?? { id: "", username: null, displayName: null, name: null, image: null }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{conversationTitle(entry)}</p>
                      {entry.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate">{entry.lastMessage.content}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="xs" onClick={() => respondRequest(entry.conversationId, "open")}>
                        {t("abrir")}
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => respondRequest(entry.conversationId, "decline")}>
                        {t("rechazarSolicitud")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {active.length === 0 && requests.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">{t("sinConversaciones")}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {active.map((entry) => (
                  <button
                    key={entry.conversationId}
                    onClick={() => selectConversation(entry.conversationId)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeId === entry.conversationId ? "bg-primary/5" : "hover:bg-primary/5"
                    }`}
                  >
                    <Avatar person={entry.otherParticipants[0] ?? { id: "", username: null, displayName: null, name: null, image: null }} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${entry.unread ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                        {conversationTitle(entry)}
                      </p>
                      {entry.lastMessage && (
                        <p className={`text-xs truncate ${entry.unread ? "text-foreground" : "text-muted-foreground"}`}>
                          {entry.lastMessage.content}
                        </p>
                      )}
                    </div>
                    {entry.unread && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sm:col-span-2 flex flex-col min-h-[480px] max-h-[600px]">
            {conversation ? (
              <>
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {otherParticipant && !conversation.isGroup && <Avatar person={otherParticipant} />}
                    {conversation.isGroup && (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-16.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                      </div>
                    )}
                    <p className="font-medium text-foreground truncate">
                      {conversation.isGroup
                        ? conversation.name || t("grupoSinNombre")
                        : displayNameOf(otherParticipant ?? { id: "", username: null, displayName: null, name: null, image: null })}
                    </p>
                  </div>

                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setMenuOpen((v) => !v)}
                      aria-label={t("opciones")}
                      className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zm0 6a.75.75 0 110-1.5.75.75 0 010 1.5zm0 6a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                      </svg>
                    </button>
                    {menuOpen && (
                      <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-xl p-1.5 z-50">
                        {!conversation.isGroup && otherParticipant?.username && (
                          <IntlLink
                            href={`/perfil/${otherParticipant.username}`}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                            {t("verPerfil")}
                          </IntlLink>
                        )}
                        {!conversation.isGroup && (
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              setShowBlockConfirm(true);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                          >
                            {t("bloquear")}
                          </button>
                        )}
                        {conversation.isGroup && (
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              setShowLeaveConfirm(true);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                          >
                            {t("salirDelGrupo")}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            setShowReport(true);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-sm text-destructive hover:bg-destructive/5 transition-colors"
                        >
                          {t("reportar")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {conversation.messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center mt-8">{t("sinMensajes")}</p>
                  ) : (
                    conversation.messages.map((m) => {
                      const mine = m.senderId === myUserId;
                      return (
                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                              mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                            }`}
                          >
                            <p className="whitespace-pre-line break-words">{m.content}</p>
                            <p className={`mt-0.5 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {new Date(m.createdAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex items-center gap-2 border-t border-border p-3"
                >
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={t("escribiMensaje")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button type="submit" size="sm" disabled={!draft.trim()}>
                    {t("enviar")}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {active.length > 0 || requests.length > 0 ? t("elegiConversacion") : t("sinConversacionesDescripcion")}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {showNewMessage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewMessage(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">{t("nuevoMensaje")}</h2>
            <Input
              autoFocus
              value={newMessageQuery}
              onChange={(e) => setNewMessageQuery(e.target.value)}
              placeholder={t("buscarPlaceholder")}
            />
            <div className="mt-3 max-h-60 overflow-y-auto space-y-1">
              {newMessageResults.map((person) => (
                <button
                  key={person.id}
                  disabled={busy}
                  onClick={() => person.username && startConversation(person.username)}
                  className="flex w-full items-center gap-3 px-2 py-2 rounded-xl hover:bg-primary/5 transition-colors text-left"
                >
                  <Avatar person={person} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{displayNameOf(person)}</p>
                    {person.username && <p className="text-xs text-muted-foreground truncate">@{person.username}</p>}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowNewMessage(false)}>
                {t("cerrar")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showNewGroup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewGroup(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">{t("nuevoGrupo")}</h2>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={t("nombreGrupoPlaceholder")}
            />
            <p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("elegiAmigos")}
            </p>
            <div className="max-h-52 overflow-y-auto space-y-1">
              {groupFriends.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("sinAmigosParaGrupo")}</p>
              ) : (
                groupFriends.map((friend) => (
                  <label
                    key={friend.id}
                    className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={groupSelected.has(friend.id)}
                      onChange={() => toggleGroupMember(friend.id)}
                      className="rounded border-border"
                    />
                    <Avatar person={friend} />
                    <p className="text-sm font-medium text-foreground truncate">{displayNameOf(friend)}</p>
                  </label>
                ))
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowNewGroup(false)}>
                {t("cerrar")}
              </Button>
              <Button size="sm" onClick={submitGroup} disabled={busy || groupSelected.size === 0}>
                {t("crearGrupo")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showReport && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowReport(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">{t("reportarTitulo")}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t("reportarDescripcion")}</p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={3}
              placeholder={t("motivoPlaceholder")}
              className="w-full rounded-xl border border-input bg-input/30 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15 resize-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowReport(false)}>
                {t("cerrar")}
              </Button>
              <Button variant="destructive" size="sm" onClick={submitReport} disabled={busy || !reportReason.trim()}>
                {t("enviarReporte")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showBlockConfirm}
        title={t("confirmarBloqueoTitulo")}
        description={t("confirmarBloqueoDescripcion")}
        confirmLabel={t("bloquear")}
        cancelLabel={t("cancelar")}
        onConfirm={confirmBlock}
        onCancel={() => setShowBlockConfirm(false)}
        busy={busy}
      />

      <ConfirmDialog
        open={showLeaveConfirm}
        title={t("confirmarSalirTitulo")}
        description={t("confirmarSalirDescripcion")}
        confirmLabel={t("salirDelGrupo")}
        cancelLabel={t("cancelar")}
        onConfirm={confirmLeave}
        onCancel={() => setShowLeaveConfirm(false)}
        busy={busy}
      />
    </main>
  );
}
