"use client";

import { useTranslations } from "next-intl";

import { useEffect, useState } from "react";
import { readJsonResponse } from "@/shared/lib/http";
import { MessageSquare, Send } from "lucide-react";
import { Link } from "@/i18n/navigation";
import ConfirmDialog from "@/shared/ui/confirm-dialog";
import CommentItem from "@/modules/community/components/comment-item";
import type { CommentDTO } from "@/modules/community/comments";

interface CurrentUser {
  id: string;
  username: string | null;
  role: "USER" | "MOD" | "ADMIN";
}

function countAll(comments: CommentDTO[]): number {
  return comments.reduce((acc, c) => acc + 1 + c.replies.length, 0);
}

export default function CommentsSection({ postId }: { postId: string }) {
  const tCompletion = useTranslations("Completion");


  const [reload, setReload] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const [success, setSuccess] = useState("");
  const [comments, setComments] = useState<CommentDTO[] | null>(null);
  const [me, setMe] = useState<CurrentUser | null | undefined>(undefined);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyValue, setReplyValue] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/community/comments?postId=${encodeURIComponent(postId)}`)
      .then(readJsonResponse)
      .then((data) => { if (!cancelled) setComments(data.comments ?? []); })
      .catch(() => { if (!cancelled) setLoadFailed(true); });

    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setMe(data.user ? { id: data.user.id, username: data.user.username, role: data.user.role } : null))
      .catch(() => setMe(null));
    return () => { cancelled = true; };
  }, [postId, reload]);

  async function submitComment() {
    if (!content.trim()) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch("/api/community/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || tCompletion("commentError"));
        return;
      }
      setComments((prev) => [...(prev ?? []), data.comment]);
      setContent("");
    } catch { setError(tCompletion("networkError")); } finally {
      setPosting(false);
    }
  }

  async function submitReply(parentId: string) {
    if (!replyValue.trim()) return;
    setReplyBusy(true);
    setError("");
    try {
      const res = await fetch("/api/community/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content: replyValue, parentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || tCompletion("replyError"));
        return;
      }
      setComments((prev) =>
        (prev ?? []).map((c) => (c.id === parentId ? { ...c, replies: [...c.replies, data.comment] } : c))
      );
      setReplyingTo(null);
      setReplyValue("");
    } catch { setError(tCompletion("networkError")); } finally {
      setReplyBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deletingId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/community/comments/${deletingId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("request_failed");
      if (res.ok) {
        setComments((prev) =>
          (prev ?? [])
            .flatMap((c) => c.id === deletingId ? c.replies : [c])
            .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== deletingId) }))
        );
      }
      setDeletingId(null);
    } catch { setError(tCompletion("networkError")); } finally {
      setBusy(false);
    }
  }

  async function confirmReport() {
    if (!reportingId || !reportReason.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/community/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId: reportingId, reason: reportReason }),
      });
      if (!res.ok) throw new Error("request_failed");
      setSuccess(tCompletion("reportedSuccess"));
      setReportingId(null);
      setReportReason("");
    } catch { setError(tCompletion("networkError")); } finally {
      setBusy(false);
    }
  }

  const total = comments ? countAll(comments) : 0;

  return (
    <div className="mt-10">
      <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-semibold text-foreground">
        <MessageSquare className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
        {tCompletion("comments")}{comments && <span className="text-muted-foreground">({total})</span>}
      </h2>

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && <p role="status" className="mb-4 text-sm text-primary">{success}</p>}
      {me === undefined ? null : me === null ? (
        <div className="mb-8 rounded-2xl border border-dashed border-primary/15 bg-card/20 px-4 py-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            {tCompletion("signIn")}</Link>{" "}
          {tCompletion("toComment")}</div>
      ) : (
        <div className="mb-8 flex items-start gap-2">
          <textarea
            maxLength={2000}
            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary/40"
            rows={3}
            placeholder={tCompletion("commentPlaceholder")}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button
            onClick={submitComment}
            disabled={posting || !content.trim()}
            className="rounded-xl bg-primary/10 p-3 text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
            title={tCompletion("comment")}
          >
            <Send className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      )}

      {loadFailed ? (
        <div role="alert" className="text-sm text-destructive">{tCompletion("loadError")} <button onClick={() => { setLoadFailed(false); setReload((value) => value + 1); }} className="ml-2 text-primary underline">{tCompletion("retry")}</button></div>
      ) : !comments ? (
        <p className="text-sm text-muted-foreground">{tCompletion("commentsLoading")}</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tCompletion("commentsEmpty")}</p>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUser={me ?? null}
              replyOpen={replyingTo === c.id}
              replyValue={replyValue}
              replyBusy={replyBusy}
              onReply={(id) => {
                setReplyingTo(id);
                setReplyValue("");
              }}
              onCancelReply={() => setReplyingTo(null)}
              onReplyValueChange={setReplyValue}
              onSubmitReply={submitReply}
              onDelete={setDeletingId}
              onReport={setReportingId}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deletingId}
        title={tCompletion("deleteComment")}
        description={tCompletion("irreversible")}
        confirmLabel={tCompletion("delete")}
        cancelLabel={tCompletion("cancel")}
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />

      {reportingId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setReportingId(null)} />
          <div className="tfl-glass tfl-glass-strong relative w-full max-w-sm rounded-2xl border p-6">
            <h2 className="mb-2 font-display text-lg font-semibold text-foreground">{tCompletion("reportComment")}</h2>
            <textarea
              autoFocus
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40"
              maxLength={500}
              rows={3}
              placeholder={tCompletion("reportReason")}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setReportingId(null)}
                className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {tCompletion("cancel")}</button>
              <button
                onClick={confirmReport}
                disabled={busy || !reportReason.trim()}
                className="rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 disabled:opacity-50"
              >
                {tCompletion("report")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
