"use client";

import { useEffect, useState } from "react";
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
    fetch(`/api/community/comments?postId=${postId}`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments ?? []))
      .catch(() => setComments([]));

    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setMe(data.user ? { id: data.user.id, username: data.user.username, role: data.user.role } : null))
      .catch(() => setMe(null));
  }, [postId]);

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
        setError(data.error || "Error al comentar");
        return;
      }
      setComments((prev) => [...(prev ?? []), data.comment]);
      setContent("");
    } finally {
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
        setError(data.error || "Error al responder");
        return;
      }
      setComments((prev) =>
        (prev ?? []).map((c) => (c.id === parentId ? { ...c, replies: [...c.replies, data.comment] } : c))
      );
      setReplyingTo(null);
      setReplyValue("");
    } finally {
      setReplyBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deletingId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/community/comments/${deletingId}`, { method: "DELETE" });
      if (res.ok) {
        setComments((prev) =>
          (prev ?? [])
            .filter((c) => c.id !== deletingId)
            .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== deletingId) }))
        );
      }
      setDeletingId(null);
    } finally {
      setBusy(false);
    }
  }

  async function confirmReport() {
    if (!reportingId || !reportReason.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/community/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId: reportingId, reason: reportReason }),
      });
      setReportingId(null);
      setReportReason("");
    } finally {
      setBusy(false);
    }
  }

  const total = comments ? countAll(comments) : 0;

  return (
    <div className="mt-10">
      <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-semibold text-foreground">
        <MessageSquare className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
        Comentarios {comments && <span className="text-muted-foreground">({total})</span>}
      </h2>

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {me === undefined ? null : me === null ? (
        <div className="mb-8 rounded-2xl border border-dashed border-primary/15 bg-card/20 px-4 py-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Iniciá sesión
          </Link>{" "}
          para comentar.
        </div>
      ) : (
        <div className="mb-8 flex items-start gap-2">
          <textarea
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary/40"
            rows={3}
            placeholder="Escribí un comentario... (usá @usuario para mencionar)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button
            onClick={submitComment}
            disabled={posting || !content.trim()}
            className="rounded-xl bg-primary/10 p-3 text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
            title="Comentar"
          >
            <Send className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      )}

      {!comments ? (
        <p className="text-sm text-muted-foreground">Cargando comentarios...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sé el primero en comentar.</p>
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
        title="Borrar comentario"
        description="Esta acción no se puede deshacer."
        confirmLabel="Borrar"
        cancelLabel="Cancelar"
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />

      {reportingId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setReportingId(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-2 font-display text-lg font-semibold text-foreground">Reportar comentario</h2>
            <textarea
              autoFocus
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40"
              rows={3}
              placeholder="Motivo del reporte"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setReportingId(null)}
                className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReport}
                disabled={busy || !reportReason.trim()}
                className="rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 disabled:opacity-50"
              >
                Reportar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
