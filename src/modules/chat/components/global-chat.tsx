"use client";
/* eslint-disable @next/next/no-img-element */

import { FormEvent, PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MessageCircle, Minus, Send, SmilePlus, Flag, Reply, X, Loader2, Plus } from "lucide-react";
import { AnchoredEmojiStickerPicker, type PickerAnchorRect } from "@/modules/chat/components/emoji-sticker-picker";
import { getQuickReactions, recordReactionUse } from "@/modules/chat/reaction-preferences";
import { UserAvatar } from "@/modules/profiles/components/user-identity";

interface Person {
  id: string;
  username: string | null;
  displayName: string | null;
  name: string;
  image: string | null;
}

interface Sticker { id: string; name: string; assetUrl: string; category: string | null }
interface Reaction { emoji: string; count: number; mine: boolean }
interface ChatMessage {
  id: string;
  authorId: string;
  author: Person;
  content: string;
  sticker: Sticker | null;
  replyTo: { id: string; author: Person; content: string; sticker: Sticker | null; deletedAt: string | null } | null;
  reactions: Reaction[];
  createdAt: string;
  deletedAt: string | null;
}

function personName(person: Person) {
  return person.displayName || person.name || person.username || "TFLives";
}

function textPreview(message: Pick<ChatMessage, "content" | "sticker">) {
  return message.content || (message.sticker ? `:${message.sticker.name}:` : "");
}

function MessageText({ content }: { content: string }) {
  const parts = content.split(/(@[a-z][a-z0-9_]{2,19})/gi);
  return <>{parts.map((part, index) => {
    const username = part.startsWith("@") ? part.slice(1).toLowerCase() : "";
    return username && username !== "everyone"
      ? <span key={`${part}-${index}`} className="font-medium text-primary">{part}</span>
      : part;
  })}</>;
}

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const map = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) map.set(message.id, message);
  return [...map.values()].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

const CHAT_BUBBLE_SIZE = 48;
const CHAT_EDGE_GAP = 12;
const DISCORD_COLLISION_GAP = 12;
const CHAT_POSITION_STORAGE_KEY = "tflives:global-chat-x";

export default function GlobalChat({ userId }: { userId: string }) {
  const t = useTranslations("GlobalChat");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showExpressions, setShowExpressions] = useState(false);
  const [reactionPicker, setReactionPicker] = useState<{ messageId: string; anchorRect: PickerAnchorRect } | null>(null);
  const [quickReactions, setQuickReactions] = useState<string[]>(() => getQuickReactions());
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [connection, setConnection] = useState<"live" | "limited">("live");
  const [error, setError] = useState("");
  const [retryPayload, setRetryPayload] = useState<{ content: string; replyToId: string | null; stickerId: string | null } | null>(null);
  const [reporting, setReporting] = useState<ChatMessage | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [notice, setNotice] = useState("");
  const [bubbleX, setBubbleX] = useState<number | null>(null);
  const [draggingBubble, setDraggingBubble] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const expressionButtonRef = useRef<HTMLButtonElement>(null);
  const closeReportButtonRef = useRef<HTMLButtonElement>(null);
  const nearBottomRef = useRef(true);
  const suppressBubbleClickRef = useRef(false);
  const bubbleDragRef = useRef<{ pointerId: number; pointerX: number; bubbleX: number; moved: boolean } | null>(null);

  const constrainBubbleX = useCallback((candidate: number) => {
    if (typeof window === "undefined") return candidate;
    const maxX = Math.max(CHAT_EDGE_GAP, window.innerWidth - CHAT_EDGE_GAP - CHAT_BUBBLE_SIZE);
    let minX = CHAT_EDGE_GAP;
    const discordButton = document.querySelector<HTMLElement>("[data-discord-fab]");
    if (discordButton) {
      const discordRect = discordButton.getBoundingClientRect();
      minX = Math.max(minX, discordRect.right + DISCORD_COLLISION_GAP);
    }
    minX = Math.min(minX, maxX);
    return Math.min(maxX, Math.max(minX, candidate));
  }, []);

  const panelLeft = useMemo(() => {
    if (bubbleX == null || typeof window === "undefined") return null;
    const panelWidth = Math.min(400, window.innerWidth - CHAT_EDGE_GAP * 2);
    const preferred = bubbleX + CHAT_BUBBLE_SIZE - panelWidth;
    return Math.max(CHAT_EDGE_GAP, Math.min(preferred, window.innerWidth - panelWidth - CHAT_EDGE_GAP));
  }, [bubbleX]);

  const refreshUnread = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/global?meta=unread", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setUnread(data.unreadCount || 0);
    } catch {
      // The chat remains usable if a background badge refresh is unavailable.
    }
  }, []);

  const scrollToBottom = useCallback((smooth = false) => {
    const element = scrollRef.current;
    if (element) element.scrollTo({ top: element.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const markRead = useCallback(async () => {
    setUnread(0);
    await fetch("/api/chat/global", { method: "PATCH" }).catch(() => {});
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [messagesResponse, stickersResponse] = await Promise.all([
        fetch("/api/chat/global?limit=40", { cache: "no-store" }),
        fetch("/api/chat/stickers", { cache: "no-store" }),
      ]);
      if (!messagesResponse.ok) throw new Error("messages");
      const data = await messagesResponse.json();
      setMessages(data.messages || []);
      setNextCursor(data.nextCursor || null);
      setUnread(data.unreadCount || 0);
      if (stickersResponse.ok) setStickers((await stickersResponse.json()).stickers || []);
      setConnection("live");
      if (data.unreadCount > 0) await markRead();
      requestAnimationFrame(() => scrollToBottom());
    } catch {
      setConnection("limited");
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }, [markRead, scrollToBottom, t]);

  const refreshIncremental = useCallback(async () => {
    const after = messages[messages.length - 1]?.id;
    if (!after) return loadInitial();
    try {
      const response = await fetch(`/api/chat/global?after=${encodeURIComponent(after)}&limit=50`, { cache: "no-store" });
      if (!response.ok) throw new Error("refresh");
      const data = await response.json();
      const incoming = data.messages || [];
      if (incoming.length) {
        const shouldScroll = nearBottomRef.current;
        setMessages((current) => mergeMessages(current, incoming));
        if (shouldScroll) requestAnimationFrame(() => scrollToBottom(true));
      }
      setUnread(data.unreadCount || 0);
      setConnection("live");
      if (data.unreadCount > 0) await markRead();
    } catch {
      setConnection("limited");
    }
  }, [loadInitial, markRead, messages, scrollToBottom]);

  useEffect(() => {
    if (window.location.hash === "#chat-global") setOpen(true);
    const onHash = () => setOpen(window.location.hash === "#chat-global");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    refreshUnread();
    const interval = window.setInterval(refreshUnread, 30_000);
    const onVisibility = () => { if (document.visibilityState === "visible") refreshUnread(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisibility); };
  }, [refreshUnread]);

  useEffect(() => {
    if (!open) return;
    loadInitial();
    const interval = window.setInterval(refreshIncremental, 5_000);
    const onVisibility = () => { if (document.visibilityState === "visible") refreshIncremental(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisibility); };
  // load an initial page once on every panel opening; later updates are incremental.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => { if (reporting) closeReportButtonRef.current?.focus(); }, [reporting]);

  useEffect(() => { setQuickReactions(getQuickReactions()); }, []);

  useEffect(() => {
    const restorePosition = () => {
      const storedValue = window.localStorage.getItem(CHAT_POSITION_STORAGE_KEY);
      const stored = storedValue == null ? Number.NaN : Number(storedValue);
      const defaultX = window.innerWidth - CHAT_EDGE_GAP - CHAT_BUBBLE_SIZE;
      setBubbleX(constrainBubbleX(Number.isFinite(stored) ? stored : defaultX));
    };
    restorePosition();
    const onResize = () => setBubbleX((current) => constrainBubbleX(current ?? window.innerWidth - CHAT_EDGE_GAP - CHAT_BUBBLE_SIZE));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [constrainBubbleX]);

  useEffect(() => {
    if (!replyTo) return;
    requestAnimationFrame(() => composerRef.current?.focus());
  }, [replyTo]);

  function toggleOpen() {
    setOpen((current) => !current);
    setNotice("");
  }

  function handleBubblePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    const startX = bubbleX ?? window.innerWidth - CHAT_EDGE_GAP - CHAT_BUBBLE_SIZE;
    bubbleDragRef.current = { pointerId: event.pointerId, pointerX: event.clientX, bubbleX: startX, moved: false };
    setDraggingBubble(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleBubblePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = bubbleDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.pointerX;
    if (!drag.moved && Math.abs(deltaX) < 5) return;
    drag.moved = true;
    setDraggingBubble(true);
    setBubbleX(constrainBubbleX(drag.bubbleX + deltaX));
  }

  function finishBubbleDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = bubbleDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (drag.moved) {
      suppressBubbleClickRef.current = true;
      const finalX = constrainBubbleX(drag.bubbleX + event.clientX - drag.pointerX);
      setBubbleX(finalX);
      window.localStorage.setItem(CHAT_POSITION_STORAGE_KEY, String(Math.round(finalX)));
    }
    bubbleDragRef.current = null;
    setDraggingBubble(false);
  }

  function handleBubbleClick() {
    if (suppressBubbleClickRef.current) {
      suppressBubbleClickRef.current = false;
      return;
    }
    toggleOpen();
  }

  function handleScroll() {
    const element = scrollRef.current;
    if (!element) return;
    nearBottomRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
  }

  async function loadOlder() {
    if (!nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const response = await fetch(`/api/chat/global?cursor=${encodeURIComponent(nextCursor)}&limit=40`, { cache: "no-store" });
      if (!response.ok) throw new Error("older");
      const data = await response.json();
      const element = scrollRef.current;
      const oldHeight = element?.scrollHeight || 0;
      setMessages((current) => mergeMessages(data.messages || [], current));
      setNextCursor(data.nextCursor || null);
      requestAnimationFrame(() => { if (element) element.scrollTop += element.scrollHeight - oldHeight; });
    } catch {
      setConnection("limited");
    } finally { setLoadingOlder(false); }
  }

  async function send(payload: { content: string; replyToId: string | null; stickerId: string | null }) {
    setSending(true); setError(""); setRetryPayload(null);
    try {
      const response = await fetch("/api/chat/global", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "send");
      setMessages((current) => mergeMessages(current, [data.message]));
      setDraft(""); setReplyTo(null); setShowExpressions(false); setConnection("live");
      requestAnimationFrame(() => {
        scrollToBottom(true);
        if (composerRef.current) composerRef.current.style.height = "";
        composerRef.current?.focus();
      });
    } catch (caught) {
      const message = caught instanceof Error && caught.message !== "send" ? caught.message : t("errorEnvio");
      setError(message); setRetryPayload(payload); setConnection("limited");
    } finally { setSending(false); }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    void send({ content, replyToId: replyTo?.id || null, stickerId: null });
  }

  function sendSticker(stickerId: string) {
    if (!sending) void send({ content: draft.trim(), replyToId: replyTo?.id || null, stickerId });
  }

  function insertEmoji(emoji: string) {
    const composer = composerRef.current;
    const start = composer?.selectionStart ?? draft.length;
    const end = composer?.selectionEnd ?? start;
    const next = `${draft.slice(0, start)}${emoji}${draft.slice(end)}`.slice(0, 2000);
    setDraft(next);
    setShowExpressions(false);
    requestAnimationFrame(() => {
      const cursor = Math.min(start + emoji.length, next.length);
      composerRef.current?.focus();
      composerRef.current?.setSelectionRange(cursor, cursor);
    });
  }

  async function react(message: ChatMessage, emoji: string) {
    const adding = !message.reactions.some((reaction) => reaction.emoji === emoji && reaction.mine);
    try {
      const response = await fetch("/api/chat/global/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: message.id, emoji }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "reaction");
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, reactions: data.reactions } : item));
      if (adding) setQuickReactions(recordReactionUse(emoji));
      setReactionPicker(null);
    } catch (caught) { setError(caught instanceof Error ? caught.message : t("error")); }
  }

  async function blockAuthor(message: ChatMessage) {
    if (!message.author.username) return;
    const response = await fetch("/api/messaging/block", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: message.author.username }) });
    if (response.ok) {
      setMessages((current) => current.filter((item) => item.authorId !== message.authorId));
      setNotice(t("bloqueado"));
    }
  }

  async function submitReport(event: FormEvent) {
    event.preventDefault();
    if (!reporting || !reportReason.trim()) return;
    const response = await fetch("/api/chat/global/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: reporting.id, reason: reportReason, details: reportDetails }) });
    if (response.ok) { setReporting(null); setReportReason(""); setReportDetails(""); setNotice(t("reporteEnviado")); }
    else { const data = await response.json().catch(() => ({})); setError(data.error || t("error")); }
  }

  const connectionLabel = connection === "live" ? t("conectado") : t("degradado");
  const sortedStickers = useMemo(() => stickers.filter((sticker) => !!sticker.assetUrl), [stickers]);

  return (
    <div id="chat-global">
      {open && (
        <section
          aria-label={t("titulo")}
          className="fixed z-[55] flex h-[min(38rem,calc(100dvh-7rem))] w-[calc(100vw-1.5rem)] max-w-[25rem] flex-col overflow-hidden rounded-2xl border border-primary/20 bg-card/95 shadow-2xl shadow-black/30 backdrop-blur-xl sm:w-[25rem]"
          style={{
            bottom: "calc(max(1rem, env(safe-area-inset-bottom)) + 3.75rem)",
            ...(panelLeft == null ? { right: CHAT_EDGE_GAP } : { left: panelLeft }),
          }}
        >
          <header className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <div className="min-w-0"><h2 className="font-display text-sm font-semibold text-foreground">{t("titulo")}</h2><p role="status" className={`text-[11px] ${connection === "live" ? "text-emerald-500" : "text-amber-500"}`}>{connectionLabel}</p></div>
            <button type="button" onClick={toggleOpen} aria-label={t("minimizar")} className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"><Minus className="h-4 w-4" /></button>
          </header>
          {notice && <p role="status" className="mx-3 mt-2 rounded-lg bg-primary/10 px-2.5 py-2 text-xs text-primary">{notice}</p>}
          {error && <div role="alert" className="mx-3 mt-2 flex items-center justify-between gap-2 rounded-lg bg-destructive/10 px-2.5 py-2 text-xs text-destructive"><span>{error}</span>{retryPayload && <button type="button" onClick={() => void send(retryPayload)} className="font-semibold underline">{t("reintentar")}</button>}</div>}
          <div ref={scrollRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto px-3 py-3" aria-live="polite">
            {nextCursor && <button type="button" onClick={loadOlder} disabled={loadingOlder} className="mb-3 w-full rounded-lg border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-primary/5 disabled:opacity-50">{loadingOlder ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" /> : t("cargarAnteriores")}</button>}
            {loading && !messages.length ? <div className="flex h-full items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("cargando")}</div> : messages.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">{t("sinMensajes")}</p> : <div className="space-y-3">
              {messages.map((message) => <article id={`global-message-${message.id}`} key={message.id} className="group flex gap-2">
                <UserAvatar identity={message.author} className="mt-0.5 size-7 text-xs" />
                <div className="min-w-0 flex-1"><div className="flex items-baseline gap-1.5"><span className="truncate text-xs font-semibold text-foreground">{personName(message.author)}</span>{message.author.username && <span className="truncate text-[10px] text-muted-foreground">@{message.author.username}</span>}<time className="ml-auto shrink-0 text-[10px] text-muted-foreground">{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>
                  {message.replyTo && <button type="button" onClick={() => document.getElementById(`global-message-${message.replyTo?.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })} className="mt-1 block max-w-full truncate border-l-2 border-primary/50 pl-2 text-left text-[11px] text-muted-foreground hover:text-primary">{personName(message.replyTo.author)}: {textPreview(message.replyTo)}</button>}
                  {message.deletedAt ? <p className="mt-1 text-xs italic text-muted-foreground">{t("mensajeEliminado")}</p> : <><p className="whitespace-pre-wrap break-words text-sm text-foreground"><MessageText content={message.content} /></p>{message.sticker && <img src={message.sticker.assetUrl} alt={message.sticker.name} className="mt-1 h-16 w-16 object-contain" />}</>}
                  {!message.deletedAt && <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    {message.reactions.map((reaction) => <button key={reaction.emoji} type="button" onClick={() => void react(message, reaction.emoji)} aria-label={`${t("reaccionar")}: ${reaction.emoji}`} className={`rounded-full border px-1.5 py-0.5 text-[11px] ${reaction.mine ? "border-primary/40 bg-primary/10" : "border-border hover:bg-primary/5"}`}>{reaction.emoji} {reaction.count}</button>)}
                    {quickReactions.filter((emoji) => !message.reactions.some((reaction) => reaction.emoji === emoji)).map((emoji) => <button key={emoji} type="button" onClick={() => void react(message, emoji)} aria-label={`${t("reaccionar")}: ${emoji}`} className="rounded-full px-1 py-0.5 text-xs opacity-0 transition-opacity hover:bg-primary/10 group-hover:opacity-100 focus-visible:opacity-100">{emoji}</button>)}
                    <span>
                      <button
                        type="button"
                        onPointerDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          const rect = event.currentTarget.getBoundingClientRect();
                          setReactionPicker((current) => current?.messageId === message.id ? null : {
                            messageId: message.id,
                            anchorRect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height },
                          });
                        }}
                        aria-label={t("masReacciones")}
                        aria-expanded={reactionPicker?.messageId === message.id}
                        className="grid h-7 w-7 place-items-center rounded-full border border-transparent text-muted-foreground opacity-0 transition-[opacity,background-color,border-color,color] hover:border-primary/20 hover:bg-primary/10 hover:text-primary group-hover:opacity-100 focus-visible:opacity-100"
                      ><Plus className="h-3 w-3" /></button>
                    </span>
                    <button type="button" onClick={() => setReplyTo(message)} className="rounded px-1 py-0.5 text-[11px] text-muted-foreground opacity-0 hover:bg-primary/10 hover:text-primary group-hover:opacity-100 focus-visible:opacity-100"><Reply className="inline h-3 w-3" /> {t("responder")}</button>
                    <button type="button" onClick={() => setReporting(message)} className="rounded p-1 text-muted-foreground opacity-0 hover:bg-primary/10 hover:text-primary group-hover:opacity-100 focus-visible:opacity-100" aria-label={t("reportar")}><Flag className="h-3 w-3" /></button>
                    {message.authorId !== userId && message.author.username && <button type="button" onClick={() => void blockAuthor(message)} className="rounded p-1 text-muted-foreground opacity-0 hover:bg-primary/10 hover:text-primary group-hover:opacity-100 focus-visible:opacity-100" aria-label={t("bloquear", { name: personName(message.author) })}><X className="h-3 w-3" /></button>}
                  </div>}</div>
              </article>)}</div>}
          </div>
          {replyTo && <div className="flex items-center gap-2 border-t border-border bg-primary/5 px-3 py-1.5 text-xs"><span className="min-w-0 flex-1 truncate">{t("respondiendoA", { name: personName(replyTo.author) })}</span><button type="button" onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-primary">{t("cancelarRespuesta")}</button></div>}
          <form onSubmit={submit} className="flex items-end gap-1 border-t border-border p-2">
            <button ref={expressionButtonRef} type="button" onClick={() => setShowExpressions((value) => !value)} aria-label={t("emojisYStickers")} aria-expanded={showExpressions} className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"><SmilePlus className="h-4 w-4" /></button>
            <textarea
              ref={composerRef}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                event.currentTarget.style.height = "auto";
                event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 96)}px`;
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }}
              maxLength={2000}
              rows={1}
              placeholder={t("escribir")}
              className="max-h-24 min-h-9 flex-1 resize-none overflow-y-auto rounded-lg border border-input bg-input/20 px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
            />
            <button disabled={sending || !draft.trim()} aria-label={sending ? t("enviando") : t("enviar")} className="rounded-lg bg-primary p-2 text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" /></button>
          </form>
        </section>
      )}
      {reactionPicker && (() => {
        const message = messages.find((item) => item.id === reactionPicker.messageId);
        return message ? (
          <AnchoredEmojiStickerPicker
            open={open}
            anchorRect={reactionPicker.anchorRect}
            onClose={() => setReactionPicker(null)}
            reactionOnly
            onEmojiSelect={(emoji) => {
              void react(message, emoji);
              setReactionPicker(null);
            }}
            labels={{ emojis: t("emojis"), stickers: t("stickers"), emptyStickers: t("sinStickers") }}
          />
        ) : null;
      })()}
      <AnchoredEmojiStickerPicker
        open={open && showExpressions}
        anchorEl={expressionButtonRef.current}
        onClose={() => setShowExpressions(false)}
        onEmojiSelect={insertEmoji}
        stickers={sortedStickers}
        onStickerSelect={sendSticker}
        labels={{ emojis: t("emojis"), stickers: t("stickers"), emptyStickers: t("sinStickers"), customEmojis: t("emojisCustom") }}
      />
      <button
        type="button"
        onClick={handleBubbleClick}
        onPointerDown={handleBubblePointerDown}
        onPointerMove={handleBubblePointerMove}
        onPointerUp={finishBubbleDrag}
        onPointerCancel={finishBubbleDrag}
        aria-label={open ? t("cerrar") : t("abrir")}
        aria-expanded={open}
        title={t("titulo")}
        className={`fixed z-[55] flex h-12 w-12 select-none items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-[transform,box-shadow] hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 ${draggingBubble ? "cursor-grabbing scale-105 shadow-xl" : "cursor-grab"}`}
        style={{
          bottom: "max(1rem, env(safe-area-inset-bottom))",
          touchAction: "none",
          ...(bubbleX == null ? { right: CHAT_EDGE_GAP } : { left: bubbleX }),
        }}
      >
        <MessageCircle className="h-5 w-5" />
        {!open && unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {reporting && <div role="dialog" aria-modal="true" aria-label={t("reportar")} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"><form onSubmit={submitReport} className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl"><div className="mb-3 flex items-center justify-between"><h3 className="font-display font-semibold">{t("reportar")}</h3><button ref={closeReportButtonRef} type="button" onClick={() => setReporting(null)} aria-label={t("cerrarReporte")} className="rounded p-1 text-muted-foreground hover:text-primary"><X className="h-4 w-4" /></button></div><input autoFocus value={reportReason} onChange={(event) => setReportReason(event.target.value)} maxLength={500} required placeholder={t("motivo")} className="mb-2 w-full rounded-lg border border-input bg-input/20 px-3 py-2 text-sm" /><textarea value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} maxLength={2000} placeholder={t("detalles")} className="mb-3 min-h-20 w-full rounded-lg border border-input bg-input/20 px-3 py-2 text-sm" /><button className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">{t("enviarReporte")}</button></form></div>}
    </div>
  );
}
