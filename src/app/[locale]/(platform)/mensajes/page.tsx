"use client";

import { readJsonResponse } from "@/shared/lib/http";
import { Suspense, useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, Link as IntlLink } from "@/i18n/navigation";
import { useSearchParams as useNextSearchParams } from "next/navigation";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import ConfirmDialog from "@/shared/ui/confirm-dialog";
import { AnchoredEmojiStickerPicker, type PickerAnchorRect } from "@/modules/chat/components/emoji-sticker-picker";
import { getQuickReactions, recordReactionUse } from "@/modules/chat/reaction-preferences";
import { CosmeticAvatarFrame } from "@/modules/cosmetics/components/cosmetic-renderer";
import { cosmeticVisualsByType, type SafeCosmeticVisual } from "@/modules/cosmetics/visuals";
import { UserAvatar } from "@/modules/profiles/components/user-identity";
import { formatUserTime } from "@/shared/lib/date-time";
import { ChevronLeft, Flag, MessageSquarePlus, MoreHorizontal, Pencil, Plus, Reply, Search, Send, Smile, Trash2, Users } from "lucide-react";

interface PersonSummary {
  id: string;
  username: string | null;
  displayName: string | null;
  name: string | null;
  image: string | null;
  cosmetics: SafeCosmeticVisual[];
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
  sender: PersonSummary;
  sticker: { id: string; name: string; assetUrl: string; category: string | null } | null;
  replyTo: { id: string; sender: PersonSummary; content: string; deletedAt: string | null } | null;
  reactions: { emoji: string; count: number; mine: boolean }[];
  editedAt: string | null;
  deletedAt: string | null;
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

function Avatar({ person, compact = false }: { person: PersonSummary; compact?: boolean }) {
  const cosmetics = cosmeticVisualsByType(person.cosmetics);
  return (
    <span className={`relative grid shrink-0 place-items-center ${compact ? "size-9" : "size-10"}`}>
      <CosmeticAvatarFrame
        preset={cosmetics.AVATAR_FRAME?.visualPreset}
        className={`tfl-chat-avatar-frame tfl-messaging-avatar absolute ${compact ? "scale-[0.62]" : "scale-[0.68]"}`}
      >
        <UserAvatar identity={person} className="size-14 shrink-0 text-sm" />
      </CosmeticAvatarFrame>
    </span>
  );
}

function conversationTitle(entry: { isGroup: boolean; name: string | null; otherParticipants: PersonSummary[] }) {
  if (entry.isGroup) return entry.name || "Grupo";
  return displayNameOf(entry.otherParticipants[0] ?? { id: "", username: null, displayName: null, name: null, image: null, cosmetics: [] });
}

function MessageDialog({
  open,
  labelledBy,
  onClose,
  children,
}: {
  open: boolean;
  labelledBy: string;
  onClose: () => void;
  children: React.ReactNode;
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
      aria-labelledby={labelledBy}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto border-0 bg-transparent p-4 backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      {children}
    </dialog>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <MessagesPageContent />
    </Suspense>
  );
}

function MessagesPageContent() {
  const t = useTranslations("MessagesPage");
  const locale = useLocale();
  const router = useRouter();
  const nextSearchParams = useNextSearchParams();

  const activeIdRef = useRef<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileConversationOpen, setMobileConversationOpen] = useState(false);
  const [conversationSearch, setConversationSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<InboxEntry[]>([]);
  const [requests, setRequests] = useState<InboxEntry[]>([]);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [showNewMessage, setShowNewMessage] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showCloseGroupConfirm, setShowCloseGroupConfirm] = useState(false);
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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ConversationMessage | null>(null);
  const [messageClock, setMessageClock] = useState(0);

  const [sendingMessage, setSendingMessage] = useState(false);
  const sendingRef = useRef(false);
  const [draft, setDraft] = useState("");
  const [replyToMessage, setReplyToMessage] = useState<ConversationMessage | null>(null);
  const [stickers, setStickers] = useState<{ id: string; name: string; assetUrl: string; category: string | null }[]>([]);
  const [showExpressions, setShowExpressions] = useState(false);
  const [reactionPicker, setReactionPicker] = useState<{ messageId: string; anchorRect: PickerAnchorRect } | null>(null);
  const [quickReactions, setQuickReactions] = useState<string[]>(() => getQuickReactions());
  const [reportTarget, setReportTarget] = useState<{ targetType: "CONVERSATION" | "DIRECT_MESSAGE"; targetId: string } | null>(null);
  const [memberUsername, setMemberUsername] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageComposerRef = useRef<HTMLTextAreaElement>(null);
  const expressionButtonRef = useRef<HTMLButtonElement>(null);
  const messageViewportRef = useRef<HTMLDivElement>(null);
  const nearConversationBottomRef = useRef(true);

  async function loadInbox() {
    try {
    const res = await fetch("/api/messaging/conversations");
    if (res.status === 401) {
      router.replace("/login?redirect=/mensajes");
      return;
    }
    const data = await readJsonResponse(res);
    setActive(data.active ?? []);
    setRequests(data.requests ?? []);
    setLoading(false);
  
    } catch { setError(t("errorGenerico")); setBusy(false); setLoading(false); }
  }

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setMyUserId(data.user?.id ?? null)).catch(() => setError(t("errorGenerico")));
    loadInbox();
    fetch("/api/chat/stickers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setStickers(data?.stickers ?? []))
      .catch(() => {});
    const initialConversationId = nextSearchParams.get("c");
    setActiveId(initialConversationId);
    setMobileConversationOpen(Boolean(initialConversationId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { setQuickReactions(getQuickReactions()); }, []);

  useEffect(() => {
    setMessageClock(Date.now());
    const interval = window.setInterval(() => setMessageClock(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  async function loadConversation(id: string, after?: string) {
    try {
    const res = await fetch(`/api/messaging/conversations/${id}${after ? `?after=${encodeURIComponent(after)}` : ""}`);
    if (res.ok) {
      const data = await readJsonResponse(res);
      if (activeIdRef.current !== id) return;
      if (!after) setNextCursor(data.nextCursor ?? null);
      setConversation((previous) => {
        if (!previous || previous.id !== data.conversation.id) return data.conversation;
        if (!after) {
          const byId = new Map<string, ConversationMessage>();
          for (const message of previous.messages) byId.set(message.id, message);
          for (const message of data.conversation.messages as ConversationMessage[]) byId.set(message.id, message);
          return {
            ...data.conversation,
            messages: [...byId.values()].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            ),
          };
        }
        const all = [...previous.messages, ...data.conversation.messages];
        return {
          ...data.conversation,
          messages: all.filter((message, index) => all.findIndex((candidate) => candidate.id === message.id) === index),
        };
      });
    } else {
      if (activeIdRef.current !== id) return;
      setError(t("errorGenerico"));
      setConversation(null);
    }
  
    } catch { setError(t("errorGenerico")); setBusy(false); }
  }

  useEffect(() => {
    activeIdRef.current = activeId;
    setConversation(null);
    setNextCursor(null);
    setReplyToMessage(null);
    setEditingMessageId(null);
    nearConversationBottomRef.current = true;
    if (activeId) loadConversation(activeId);
    else setConversation(null);
  }, [activeId]);

  useEffect(() => {
    if (nearConversationBottomRef.current) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length]);

  useEffect(() => {
    if (!replyToMessage) return;
    requestAnimationFrame(() => messageComposerRef.current?.focus());
  }, [replyToMessage]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const closeMenu = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeMenu);
    return () => window.removeEventListener("keydown", closeMenu);
  }, []);

  const latestMessageId = conversation?.messages[conversation.messages.length - 1]?.id ?? null;

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    let refreshCount = 0;

    async function refreshConversation(forceFull = false) {
      if (cancelled || !activeId) return;
      refreshCount += 1;
      const fullRefresh = forceFull || refreshCount % 3 === 0;
      await Promise.all([loadConversation(activeId, fullRefresh ? undefined : latestMessageId ?? undefined), loadInbox()]);
    }

    const interval = window.setInterval(() => void refreshConversation(), 5_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refreshConversation(true);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, latestMessageId]);

  function selectConversation(id: string) {
    activeIdRef.current = id;
    setActiveId(id);
    setMobileConversationOpen(true);
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
        .then((data) => setNewMessageResults(data.results ?? [])).catch(() => setError(t("errorGenerico")));
    }, 300);
    return () => clearTimeout(handle);
  }, [newMessageQuery, showNewMessage]);

  async function startConversation(username: string) {
    try {
    setBusy(true);
    setError("");
    const res = await fetch("/api/messaging/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(t("errorGenerico"));
      return;
    }
    const data = await res.json();
    setShowNewMessage(false);
    await loadInbox();
    selectConversation(data.conversation.id);
  
    } catch { setError(t("errorGenerico")); setBusy(false); }
  }

  async function openNewGroup() {
    try {
    const res = await fetch("/api/social/friends");
    const data = await res.json();
    setGroupFriends(data.friends ?? []);
    setGroupSelected(new Set());
    setGroupName("");
    setShowNewGroup(true);
  
    } catch { setError(t("errorGenerico")); setBusy(false); }
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
    try {
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
    setBusy(false);
    if (!res.ok) {
      setError(t("errorGenerico"));
      return;
    }
    const data = await res.json();
    setShowNewGroup(false);
    await loadInbox();
    selectConversation(data.conversation.id);
  
    } catch { setError(t("errorGenerico")); setBusy(false); }
  }

  async function respondRequest(id: string, action: "open" | "decline") {
    try {
    const response = await fetch(`/api/messaging/conversations/${id}/requests`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await loadInbox();
    if (!response.ok) throw new Error("request_failed");
    if (action === "open") selectConversation(id);
  
    } catch { setError(t("errorGenerico")); setBusy(false); }
  }

  async function submitMessage(stickerId?: string) {
    if (!activeId || sendingRef.current || (!draft.trim() && !stickerId)) return;
    const conversationId = activeId;
    const content = draft;
    sendingRef.current = true;
    setSendingMessage(true);
    setError("");
    try {
      const response = await fetch(`/api/messaging/conversations/${conversationId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, stickerId, replyToId: replyToMessage?.id ?? null }),
      });
      const data = await readJsonResponse(response);
      setConversation((previous) => !previous || previous.id !== conversationId || previous.messages.some((m) => m.id === data.message.id) ? previous : { ...previous, messages: [...previous.messages, data.message] });
      if (activeIdRef.current === conversationId) {
        setDraft((current) => current === content ? "" : current);
        setReplyToMessage(null);
        setShowExpressions(false);
        messageComposerRef.current?.focus();
      }
      await loadInbox();
    } catch { setError(t("errorGenerico")); }
    finally { sendingRef.current = false; setSendingMessage(false); }
  }
  async function sendMessage() { await submitMessage(); }
  async function sendSticker(stickerId: string) { await submitMessage(stickerId); }

  function insertEmoji(emoji: string) {
    const composer = messageComposerRef.current;
    const start = composer?.selectionStart ?? draft.length;
    const end = composer?.selectionEnd ?? start;
    const next = `${draft.slice(0, start)}${emoji}${draft.slice(end)}`.slice(0, 2000);
    setDraft(next);
    setShowExpressions(false);
    requestAnimationFrame(() => {
      const cursor = Math.min(start + emoji.length, next.length);
      messageComposerRef.current?.focus();
      messageComposerRef.current?.setSelectionRange(cursor, cursor);
    });
  }

  function startEditingMessage(message: ConversationMessage) {
    setEditingMessageId(message.id);
    setEditingDraft(message.content);
    setError("");
  }

  async function saveEditedMessage(messageId: string) {
    const content = editingDraft.trim();
    if (!content) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/messaging/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(t("errorGenerico"));
        return;
      }
      setConversation((prev) => prev ? {
        ...prev,
        messages: prev.messages.map((message) => message.id === messageId ? data.message : message),
      } : prev);
      setEditingMessageId(null);
      setEditingDraft("");
      await loadInbox();
    } catch { setError(t("errorGenerico")); } finally {
      setBusy(false);
    }
  }

  async function confirmDeleteMessage() {
    if (!deleteTarget) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/messaging/messages/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(t("errorGenerico"));
        return;
      }
      setConversation((prev) => prev ? {
        ...prev,
        messages: prev.messages.map((message) => message.id === deleteTarget.id ? data.message : message),
      } : prev);
      if (editingMessageId === deleteTarget.id) {
        setEditingMessageId(null);
        setEditingDraft("");
      }
      if (replyToMessage?.id === deleteTarget.id) setReplyToMessage(null);
      setDeleteTarget(null);
      await loadInbox();
    } catch { setError(t("errorGenerico")); } finally {
      setBusy(false);
    }
  }

  async function reactToMessage(message: ConversationMessage, emoji: string) {
    try {
    const adding = !message.reactions.some((reaction) => reaction.emoji === emoji && reaction.mine);
    const res = await fetch(`/api/messaging/messages/${message.id}/reactions`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emoji }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(t("errorGenerico")); return; }
    setConversation((prev) => prev ? { ...prev, messages: prev.messages.map((item) => item.id === message.id ? { ...item, reactions: data.reactions } : item) } : prev);
    if (adding) setQuickReactions(recordReactionUse(emoji));
    setReactionPicker(null);
  
    } catch { setError(t("errorGenerico")); setBusy(false); }
  }

  async function loadOlderMessages() {
    try {
    if (!activeId || !nextCursor) return;
    const viewport = messageViewportRef.current;
    const previousHeight = viewport?.scrollHeight ?? 0;
    const res = await fetch(`/api/messaging/conversations/${activeId}?cursor=${encodeURIComponent(nextCursor)}`);
    if (!res.ok) return;
    const data = await res.json();
    setNextCursor(data.nextCursor ?? null);
    setConversation((prev) => !prev || prev.id !== data.conversation.id ? prev : { ...data.conversation, messages: [...data.conversation.messages, ...prev.messages].filter((message: ConversationMessage, index: number, all: ConversationMessage[]) => all.findIndex((candidate) => candidate.id === message.id) === index) });
    requestAnimationFrame(() => { if (viewport) viewport.scrollTop += viewport.scrollHeight - previousHeight; });
  
    } catch { setError(t("errorGenerico")); setBusy(false); }
  }

  function trackConversationScroll() {
    const viewport = messageViewportRef.current;
    if (!viewport) return;
    nearConversationBottomRef.current = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 80;
  }

  async function addMember() {
    try {
    if (!activeId || !memberUsername.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/messaging/conversations/${activeId}/members`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: memberUsername }) });
    setBusy(false);
    if (!res.ok) { setError(t("errorGenerico")); return; }
    setMemberUsername("");
    loadConversation(activeId);
  
    } catch { setError(t("errorGenerico")); setBusy(false); }
  }

  async function removeMember(targetUserId: string) {
    try {
    if (!activeId) return;
    setBusy(true);
    const res = await fetch(`/api/messaging/conversations/${activeId}/members`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetUserId }) });
    setBusy(false);
    if (!res.ok) { setError(t("errorGenerico")); return; }
    loadConversation(activeId);
  
    } catch { setError(t("errorGenerico")); setBusy(false); }
  }

  async function confirmBlock() {
    try {
    if (!conversation) return;
    const other = conversation.participants.find((p) => p.userId !== myUserId)?.user;
    if (!other?.username) return;
    setBusy(true);
    const response = await fetch("/api/messaging/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: other.username }),
    });
    setBusy(false);
    if (!response.ok) throw new Error("request_failed");
    setShowBlockConfirm(false);
    setActiveId(null);
    router.push("/mensajes");
    await loadInbox();
  
    } catch { setError(t("errorGenerico")); setBusy(false); }
  }

  async function confirmLeave() {
    try {
    if (!activeId) return;
    setBusy(true);
    const response = await fetch(`/api/messaging/conversations/${activeId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setBusy(false);
    if (!response.ok) throw new Error("request_failed");
    setShowLeaveConfirm(false);
    setActiveId(null);
    router.push("/mensajes");
    await loadInbox();
  
    } catch { setError(t("errorGenerico")); setBusy(false); }
  }

  async function confirmCloseGroup() {
    try {
    if (!activeId) return;
    setBusy(true);
    const res = await fetch(`/api/messaging/conversations/${activeId}/members`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "close" }),
    });
    setBusy(false);
    if (!res.ok) { setError(t("errorGenerico")); return; }
    setShowCloseGroupConfirm(false);
    setActiveId(null);
    router.push("/mensajes");
    await loadInbox();
  
    } catch { setError(t("errorGenerico")); setBusy(false); }
  }

  async function submitReport() {
    try {
    if (!reportTarget || !reportReason.trim()) return;
    setBusy(true);
    const response = await fetch("/api/messaging/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: reportTarget.targetType, targetId: reportTarget.targetId, reason: reportReason }),
    });
    setBusy(false);
    if (!response.ok) throw new Error("request_failed");
    setReportReason("");
    setReportTarget(null);
    setShowReport(false);
  
    } catch { setError(t("errorGenerico")); setBusy(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const otherParticipant = conversation?.participants.find((p) => p.userId !== myUserId)?.user ?? null;
  const normalizedConversationSearch = conversationSearch.trim().toLowerCase();
  const visibleActive = normalizedConversationSearch
    ? active.filter((entry) => {
        const title = conversationTitle(entry).toLowerCase();
        const usernames = entry.otherParticipants.map((person) => person.username || "").join(" ").toLowerCase();
        return title.includes(normalizedConversationSearch) || usernames.includes(normalizedConversationSearch);
      })
    : active;

  return (
    <main className="h-[100dvh] overflow-hidden px-3 pb-3 pt-20 sm:px-5 sm:pb-5 sm:pt-24">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col">
        {error && (
          <div role="alert" className="mb-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card className="tfl-messages-shell grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-2xl border-border/80 bg-card/85 p-0 shadow-2xl sm:grid-cols-[300px_minmax(0,1fr)]">
          <aside className={`${mobileConversationOpen ? "hidden sm:flex" : "flex"} min-h-0 flex-col border-border bg-muted/20 sm:border-r`}>
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/80 px-3">
              <h1 className="truncate px-2 font-display text-base font-semibold text-foreground">{t("titulo")}</h1>
              <div className="flex items-center gap-1">
                <button type="button" onClick={openNewGroup} title={t("nuevoGrupo")} aria-label={t("nuevoGrupo")} className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
                  <Users className="size-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={openNewMessage} title={t("nuevoMensaje")} aria-label={t("nuevoMensaje")} className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
                  <MessageSquarePlus className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="shrink-0 border-b border-border/70 p-2.5">
              <label className="flex h-9 items-center gap-2 rounded-lg border border-border/80 bg-background/65 px-3 text-muted-foreground shadow-inner focus-within:border-primary/45 focus-within:text-foreground">
                <Search className="size-3.5 shrink-0" aria-hidden="true" />
                <input
                  value={conversationSearch}
                  onChange={(event) => setConversationSearch(event.target.value)}
                  placeholder={t("buscarPlaceholder")}
                  className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
                />
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {requests.length > 0 && (
                <section className="mb-3">
                  <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t("solicitudesMensaje")}</p>
                  <div className="space-y-1">
                    {requests.map((entry) => {
                      const person = entry.otherParticipants[0] ?? { id: "", username: null, displayName: null, name: null, image: null, cosmetics: [] };
                      return (
                        <div key={entry.conversationId} className="rounded-xl border border-primary/15 bg-primary/5 p-2.5">
                          <div className="flex items-center gap-3">
                            <Avatar person={person} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">{conversationTitle(entry)}</p>
                              <p className="truncate text-xs text-muted-foreground">{entry.lastMessage?.content || `@${person.username || "tflives"}`}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex gap-1.5 pl-[52px]">
                            <Button size="xs" onClick={() => respondRequest(entry.conversationId, "open")}>{t("abrir")}</Button>
                            <Button size="xs" variant="ghost" onClick={() => respondRequest(entry.conversationId, "decline")}>{t("rechazarSolicitud")}</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t("titulo")}</p>
                <button type="button" onClick={openNewMessage} aria-label={t("nuevoMensaje")} className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-primary/10 hover:text-primary">
                  <Plus className="size-3.5" aria-hidden="true" />
                </button>
              </div>

              {active.length === 0 && requests.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">{t("sinConversaciones")}</p>
                  <button type="button" onClick={openNewMessage} className="mt-3 text-xs font-medium text-primary hover:underline">{t("nuevoMensaje")}</button>
                </div>
              ) : visibleActive.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground">{t("elegiConversacion")}</div>
              ) : (
                <div className="space-y-0.5">
                  {visibleActive.map((entry) => {
                    const person = entry.otherParticipants[0] ?? { id: "", username: null, displayName: null, name: null, image: null, cosmetics: [] };
                    return (
                      <button
                        key={entry.conversationId}
                        onClick={() => selectConversation(entry.conversationId)}
                        className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
                          activeId === entry.conversationId ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-foreground/[0.045] hover:text-foreground"
                        }`}
                      >
                        {entry.isGroup ? (
                          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Users className="size-[18px]" aria-hidden="true" /></div>
                        ) : <Avatar person={person} />}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`min-w-0 flex-1 truncate text-sm ${entry.unread ? "font-semibold text-foreground" : "font-medium"}`}>{conversationTitle(entry)}</p>
                            {entry.unread && <span className="size-2 shrink-0 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.55)]" />}
                          </div>
                          <p className={`truncate text-xs ${entry.unread ? "text-foreground/80" : "text-muted-foreground"}`}>
                            {entry.lastMessage?.content || (person.username ? `@${person.username}` : t("sinMensajes"))}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          <section className={`${mobileConversationOpen ? "flex" : "hidden sm:flex"} min-h-0 min-w-0 flex-col bg-background/35`}>
            {conversation ? (
              <>
                <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-card/50 px-3 sm:px-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <button type="button" onClick={() => setMobileConversationOpen(false)} className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary sm:hidden" aria-label={t("volverAConversaciones")}>
                      <ChevronLeft className="size-5" aria-hidden="true" />
                    </button>
                    {otherParticipant && !conversation.isGroup ? <Avatar person={otherParticipant} /> : (
                      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Users className="size-[18px]" aria-hidden="true" /></div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {conversation.isGroup ? conversation.name || t("grupoSinNombre") : displayNameOf(otherParticipant ?? { id: "", username: null, displayName: null, name: null, image: null, cosmetics: [] })}
                        </p>
                        {!conversation.isGroup && otherParticipant?.username && <span className="hidden truncate text-xs text-muted-foreground md:inline">@{otherParticipant.username}</span>}
                      </div>
                      {conversation.isGroup && <p className="text-[11px] text-muted-foreground">{conversation.participants.filter((participant) => participant.status === "ACTIVE").length} {t("miembros").toLowerCase()}</p>}
                    </div>
                    {conversation.isGroup && (
                      <details className="relative hidden md:block">
                        <summary className="cursor-pointer list-none rounded-md px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10">{t("miembros")}</summary>
                        <div className="tfl-glass tfl-glass-strong absolute left-0 top-8 z-40 w-72 rounded-2xl border p-3 shadow-xl">
                          <div className="max-h-48 space-y-1 overflow-y-auto">
                            {conversation.participants.filter((participant) => participant.status === "ACTIVE").map((participant) => (
                              <div key={participant.userId} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-primary/5">
                                <Avatar person={participant.user} />
                                <span className="min-w-0 flex-1 truncate">{displayNameOf(participant.user)}</span>
                                {conversation.participants.find((item) => item.userId === myUserId)?.role === "OWNER" && participant.userId !== myUserId && (
                                  <button type="button" disabled={busy} onClick={() => removeMember(participant.userId)} className="text-destructive hover:underline">{t("quitarMiembro")}</button>
                                )}
                              </div>
                            ))}
                          </div>
                          {conversation.participants.find((participant) => participant.userId === myUserId)?.role === "OWNER" && (
                            <div className="mt-2 flex gap-1">
                              <Input value={memberUsername} onChange={(event) => setMemberUsername(event.target.value)} placeholder={t("usernameMiembro")} className="h-8 text-xs" />
                              <Button type="button" size="xs" disabled={busy || !memberUsername.trim()} onClick={addMember}>{t("agregarMiembro")}</Button>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>

                  <div className="relative" ref={menuRef}>
                    <button onClick={() => setMenuOpen((value) => !value)} aria-label={t("opciones")} className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary">
                      <MoreHorizontal className="size-5" aria-hidden="true" />
                    </button>
                    {menuOpen && (
                      <div className="tfl-glass tfl-glass-strong absolute right-0 z-50 mt-2 w-48 rounded-2xl border p-1.5">
                        {!conversation.isGroup && otherParticipant?.username && (
                          <IntlLink href={`/perfil/${otherParticipant.username}`} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/5 hover:text-primary" onClick={() => setMenuOpen(false)}>
                            {t("verPerfil")}
                          </IntlLink>
                        )}
                        {!conversation.isGroup && <button onClick={() => { setMenuOpen(false); setShowBlockConfirm(true); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/5 hover:text-primary">{t("bloquear")}</button>}
                        {conversation.isGroup && <button onClick={() => { setMenuOpen(false); setShowLeaveConfirm(true); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/5 hover:text-primary">{t("salirDelGrupo")}</button>}
                        {conversation.isGroup && conversation.participants.find((participant) => participant.userId === myUserId)?.role === "OWNER" && <button onClick={() => { setMenuOpen(false); setShowCloseGroupConfirm(true); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/5">{t("cerrarGrupo")}</button>}
                        <button onClick={() => { setMenuOpen(false); if (activeId) setReportTarget({ targetType: "CONVERSATION", targetId: activeId }); setShowReport(true); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/5">{t("reportar")}</button>
                      </div>
                    )}
                  </div>
                </header>

                <div ref={messageViewportRef} onScroll={trackConversationScroll} className="tfl-direct-message-viewport min-h-0 flex-1 overflow-y-auto px-2 py-4 sm:px-4">
                  {nextCursor && (
                    <div className="mb-4 flex justify-center">
                      <button type="button" onClick={loadOlderMessages} className="rounded-full border border-border bg-card/80 px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm hover:bg-primary/5 hover:text-primary">{t("cargarAnteriores")}</button>
                    </div>
                  )}
                  {conversation.messages.length === 0 ? (
                    <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center px-6 text-center">
                      {otherParticipant && !conversation.isGroup && <Avatar person={otherParticipant} />}
                      <p className="mt-4 text-base font-semibold text-foreground">{conversation.isGroup ? conversation.name || t("grupoSinNombre") : displayNameOf(otherParticipant ?? { id: "", username: null, displayName: null, name: null, image: null, cosmetics: [] })}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{t("sinMensajes")}</p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {conversation.messages.map((m, index) => {
                        const mine = m.senderId === myUserId;
                        const previous = index > 0 ? conversation.messages[index - 1] : null;
                        const grouped = !!previous && previous.senderId === m.senderId && !m.replyTo && new Date(m.createdAt).getTime() - new Date(previous.createdAt).getTime() < 5 * 60_000;
                        const isEditing = editingMessageId === m.id;
                        const canEdit = mine && !m.deletedAt && !!m.content.trim() && messageClock > 0 && messageClock - new Date(m.createdAt).getTime() <= 15 * 60_000;
                        return (
                          <article id={`message-${m.id}`} key={m.id} className={`tfl-message-row group relative grid grid-cols-[44px_minmax(0,1fr)] gap-1.5 py-0.5 transition-colors hover:bg-foreground/[0.045] ${grouped ? "mt-0" : "mt-2.5"}`}>
                            <div className="flex justify-center pt-1">
                              {grouped ? <time className="mt-1 hidden text-[9px] text-muted-foreground/70 group-hover:block">{formatUserTime(m.createdAt, locale)}</time> : <Avatar person={m.sender} compact />}
                            </div>
                            <div className="min-w-0 pr-1">
                              {!grouped && (
                                <div className="mb-0.5 flex min-w-0 items-baseline gap-2">
                                  <span className={`truncate text-sm font-semibold ${mine ? "text-primary" : "text-foreground"}`}>{displayNameOf(m.sender)}</span>
                                  {m.sender.username && <span className="hidden truncate text-[11px] text-muted-foreground md:inline">@{m.sender.username}</span>}
                                  <time className="shrink-0 text-[10px] text-muted-foreground">{formatUserTime(m.createdAt, locale)}</time>
                                </div>
                              )}

                              <div className="max-w-[min(100%,760px)] text-sm text-foreground">
                                  {m.replyTo && (
                                    <button type="button" onClick={() => document.getElementById(`message-${m.replyTo?.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })} className="mb-1.5 block max-w-full truncate border-l-2 border-primary/55 pl-2 text-left text-[11px] text-muted-foreground hover:text-primary">
                                      <span className="font-medium text-foreground/80">{displayNameOf(m.replyTo.sender)}</span>: {m.replyTo.deletedAt ? t("mensajeEliminado") : m.replyTo.content}
                                    </button>
                                  )}
                                  {m.deletedAt ? (
                                    <p className="italic text-muted-foreground">{t("mensajeEliminado")}</p>
                                  ) : isEditing ? (
                                    <div className="space-y-2">
                                      <textarea autoFocus value={editingDraft} onChange={(event) => setEditingDraft(event.target.value)} maxLength={2000} rows={2} className="max-h-32 min-h-16 w-full min-w-0 resize-y rounded-xl border border-border bg-background/70 px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/15" />
                                      {m.sticker && <img src={m.sticker.assetUrl} alt={m.sticker.name} className="h-16 w-16 object-contain" />}
                                      <div className="flex justify-end gap-2 text-[11px]">
                                        <button type="button" disabled={busy} onClick={() => { setEditingMessageId(null); setEditingDraft(""); }} className="rounded-lg px-2 py-1 text-muted-foreground hover:bg-primary/5 hover:text-foreground">{t("cancelar")}</button>
                                        <button type="button" disabled={busy || !editingDraft.trim()} onClick={() => void saveEditedMessage(m.id)} className="rounded-lg bg-primary/10 px-2 py-1 font-medium text-primary hover:bg-primary/15 disabled:opacity-50">{t("guardarEdicion")}</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="whitespace-pre-line break-words leading-relaxed">{m.content}</p>
                                      {m.sticker && <img src={m.sticker.assetUrl} alt={m.sticker.name} className="mt-1 h-20 w-20 object-contain" />}
                                    </>
                                  )}
                                  {m.editedAt && <p className="mt-0.5 text-[10px] text-muted-foreground">{t("editado")}</p>}
                              </div>

                              {!m.deletedAt && !isEditing && m.reactions.length > 0 && (
                                <div className="mt-1 flex min-h-7 flex-wrap items-center gap-1">
                                  {m.reactions.map((reaction) => <button key={reaction.emoji} type="button" onClick={() => void reactToMessage(m, reaction.emoji)} className={`rounded-full border px-2 py-0.5 text-[11px] ${reaction.mine ? "border-primary/35 bg-primary/10 text-primary" : "border-border bg-card/60 text-foreground"}`}>{reaction.emoji} {reaction.count}</button>)}
                                </div>
                              )}
                            </div>

                            {!m.deletedAt && !isEditing && (
                              <div className="tfl-message-actions absolute right-3 top-0 z-10 flex -translate-y-1/2 items-center rounded-lg border border-border/70 bg-card/95 px-0.5 opacity-100 shadow-md backdrop-blur-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100">
                                {quickReactions.filter((emoji) => !m.reactions.some((reaction) => reaction.emoji === emoji)).slice(0, 2).map((emoji) => <button key={emoji} type="button" onClick={() => void reactToMessage(m, emoji)} aria-label={`${t("reaccionar")} ${emoji}`} className="grid size-7 place-items-center rounded-md text-xs hover:bg-primary/10">{emoji}</button>)}
                                <button type="button" onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); const rect = event.currentTarget.getBoundingClientRect(); setReactionPicker((current) => current?.messageId === m.id ? null : { messageId: m.id, anchorRect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height } }); }} aria-label={t("masReacciones")} aria-expanded={reactionPicker?.messageId === m.id} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary"><Smile className="size-3.5" aria-hidden="true" /></button>
                                <button type="button" onClick={() => setReplyToMessage(m)} title={t("responder")} aria-label={t("responder")} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary"><Reply className="size-3.5" aria-hidden="true" /></button>
                                {mine && canEdit && <button type="button" onClick={() => startEditingMessage(m)} title={t("editarMensaje")} aria-label={t("editarMensaje")} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary"><Pencil className="size-3.5" aria-hidden="true" /></button>}
                                {mine ? <button type="button" onClick={() => setDeleteTarget(m)} title={t("eliminarMensaje")} aria-label={t("eliminarMensaje")} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-3.5" aria-hidden="true" /></button> : <button type="button" title={t("reportar")} aria-label={t("reportar")} onClick={() => { setReportTarget({ targetType: "DIRECT_MESSAGE", targetId: m.id }); setShowReport(true); }} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Flag className="size-3.5" aria-hidden="true" /></button>}
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="shrink-0 px-3 pb-3 sm:px-4 sm:pb-4">
                  {replyToMessage && (
                    <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-border bg-muted/65 px-3 py-2 text-xs">
                      <span className="min-w-0 truncate text-muted-foreground">{t("respondiendoA", { name: displayNameOf(replyToMessage.sender) })}</span>
                      <button type="button" onClick={() => setReplyToMessage(null)} className="ml-3 shrink-0 text-primary hover:underline">{t("cancelarRespuesta")}</button>
                    </div>
                  )}
                  <form onSubmit={(event) => { event.preventDefault(); sendMessage(); }} className={`flex items-end gap-1.5 border border-border bg-muted/45 p-2 shadow-inner ${replyToMessage ? "rounded-b-xl" : "rounded-xl"}`}>
                    <button type="button" onClick={openNewMessage} aria-label={t("nuevoMensaje")} className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"><Plus className="size-[18px]" aria-hidden="true" /></button>
                    <textarea
                      ref={messageComposerRef}
                      value={draft}
                      onChange={(event) => { setDraft(event.target.value); event.currentTarget.style.height = "auto"; event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 120)}px`; }}
                      placeholder={t("escribiMensaje")}
                      rows={1}
                      maxLength={2000}
                      onKeyDown={(event) => { if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return; event.preventDefault(); event.currentTarget.form?.requestSubmit(); }}
                      className="max-h-28 min-h-9 flex-1 resize-none overflow-y-auto bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                    <button ref={expressionButtonRef} type="button" onClick={() => setShowExpressions((value) => !value)} aria-label={t("emojisYStickers")} aria-expanded={showExpressions} className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"><Smile className="size-[18px]" aria-hidden="true" /></button>
                    <button type="submit" aria-label={t("enviar")} disabled={sendingMessage || !draft.trim()} className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-opacity disabled:opacity-40"><Send className="size-4" aria-hidden="true" /></button>
                  </form>
                </div>

                {reactionPicker && (() => {
                  const message = conversation.messages.find((item) => item.id === reactionPicker.messageId);
                  return message ? <AnchoredEmojiStickerPicker open anchorRect={reactionPicker.anchorRect} onClose={() => setReactionPicker(null)} reactionOnly onEmojiSelect={(emoji) => { void reactToMessage(message, emoji); setReactionPicker(null); }} labels={{ emojis: t("emojis"), stickers: t("stickers"), emptyStickers: t("sinStickers") }} /> : null;
                })()}
                <AnchoredEmojiStickerPicker open={showExpressions} anchorEl={expressionButtonRef.current} onClose={() => setShowExpressions(false)} onEmojiSelect={insertEmoji} stickers={stickers} onStickerSelect={sendSticker} labels={{ emojis: t("emojis"), stickers: t("stickers"), emptyStickers: t("sinStickers"), customEmojis: t("emojisCustom") }} />
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="grid size-16 place-items-center rounded-full border border-border bg-muted/60 text-primary shadow-inner"><MessageSquarePlus className="size-7" aria-hidden="true" /></div>
                <p className="mt-4 text-base font-semibold text-foreground">{t("titulo")}</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">{active.length > 0 || requests.length > 0 ? t("elegiConversacion") : t("sinConversacionesDescripcion")}</p>
                <Button size="sm" className="mt-4" onClick={openNewMessage}>{t("nuevoMensaje")}</Button>
              </div>
            )}
          </section>
        </Card>
      </div>
      {showNewMessage && (
        <MessageDialog open={showNewMessage} labelledBy="new-message-title" onClose={() => setShowNewMessage(false)}>
          <div className="relative w-full rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6">
            <h2 id="new-message-title" className="font-display text-lg font-semibold text-foreground mb-4">{t("nuevoMensaje")}</h2>
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
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-primary/5"
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
        </MessageDialog>
      )}

      {showNewGroup && (
        <MessageDialog open={showNewGroup} labelledBy="new-group-title" onClose={() => setShowNewGroup(false)}>
          <div className="relative w-full rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6">
            <h2 id="new-group-title" className="font-display text-lg font-semibold text-foreground mb-4">{t("nuevoGrupo")}</h2>
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
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-primary/5"
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
        </MessageDialog>
      )}

      {showReport && (
        <MessageDialog open={showReport} labelledBy="report-conversation-title" onClose={() => setShowReport(false)}>
          <div className="relative w-full rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6">
            <h2 id="report-conversation-title" className="font-display text-lg font-semibold text-foreground mb-2">{t("reportarTitulo")}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t("reportarDescripcion")}</p>
            <textarea
              autoFocus
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
        </MessageDialog>
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

      <ConfirmDialog
        open={showCloseGroupConfirm}
        title={t("confirmarCerrarGrupoTitulo")}
        description={t("confirmarCerrarGrupoDescripcion")}
        confirmLabel={t("cerrarGrupo")}
        cancelLabel={t("cancelar")}
        onConfirm={confirmCloseGroup}
        onCancel={() => setShowCloseGroupConfirm(false)}
        busy={busy}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("confirmarEliminarMensajeTitulo")}
        description={t("confirmarEliminarMensajeDescripcion")}
        confirmLabel={t("eliminarMensaje")}
        cancelLabel={t("cancelar")}
        onConfirm={() => void confirmDeleteMessage()}
        onCancel={() => setDeleteTarget(null)}
        busy={busy}
      />
    </main>
  );
}
