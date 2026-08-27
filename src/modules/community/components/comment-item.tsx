"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { MoreHorizontal, Reply as ReplyIcon, Send } from "lucide-react";
import { Link } from "@/i18n/navigation";
import LikeButton from "@/modules/community/components/like-button";
import type { CommentDTO } from "@/modules/community/comments";

interface CurrentUser {
  id: string;
  role: "USER" | "MOD" | "ADMIN";
}

function renderContent(content: string) {
  const parts = content.split(/(@[a-zA-Z0-9_]{2,32})/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="font-medium text-primary">
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

function authorLabel(author: CommentDTO["author"]) {
  if (!author) return "Usuario eliminado";
  return author.displayName || author.name || author.username || "Usuario";
}

export default function CommentItem({
  comment,
  currentUser,
  isReply = false,
  replyOpen,
  replyValue,
  replyBusy,
  onReply,
  onCancelReply,
  onReplyValueChange,
  onSubmitReply,
  onDelete,
  onReport,
}: {
  comment: CommentDTO;
  currentUser: CurrentUser | null;
  isReply?: boolean;
  replyOpen?: boolean;
  replyValue?: string;
  replyBusy?: boolean;
  onReply?: (commentId: string) => void;
  onCancelReply?: () => void;
  onReplyValueChange?: (value: string) => void;
  onSubmitReply?: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onReport: (commentId: string) => void;
}) {
  const isOwn = currentUser?.id === comment.authorId;
  const canModerate = currentUser?.role === "MOD" || currentUser?.role === "ADMIN";
  const canDelete = isOwn || canModerate;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div className={isReply ? "pl-11" : ""}>
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-primary/5 text-xs font-semibold text-primary">
          {authorLabel(comment.author).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl border border-border bg-card/30 px-4 py-3">
            <div className="flex items-center gap-2">
              {comment.author?.username ? (
                <Link href={`/perfil/${comment.author.username}`} className="text-sm font-medium text-foreground hover:text-primary">
                  {authorLabel(comment.author)}
                </Link>
              ) : (
                <span className="text-sm font-medium text-foreground">{authorLabel(comment.author)}</span>
              )}
              <span className="text-xs text-muted-foreground/50">
                {new Date(comment.createdAt).toLocaleDateString("es-ES")}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground/90">
              {renderContent(comment.content)}
            </p>
          </div>

          <div className="mt-1.5 flex items-center gap-3 px-1">
            <LikeButton targetType="COMMENT" targetId={comment.id} />
            {!isReply && currentUser && onReply && (
              <button
                onClick={() => onReply(comment.id)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                <ReplyIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
                Responder
              </button>
            )}
            {currentUser && (!isOwn || canDelete) && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="text-muted-foreground/60 transition-colors hover:text-foreground"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
                {menuOpen && (
                  <div className="absolute left-0 top-full z-10 mt-1 min-w-32 rounded-lg border border-border bg-card py-1 shadow-lg">
                    {!isOwn && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onReport(comment.id);
                        }}
                        className="block w-full px-3 py-1.5 text-left text-xs text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                      >
                        Reportar
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete(comment.id);
                        }}
                        className="block w-full px-3 py-1.5 text-left text-xs text-destructive hover:bg-destructive/10"
                      >
                        Borrar
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {replyOpen && (
            <div className="mt-3 flex items-start gap-2">
              <textarea
                autoFocus
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40"
                rows={2}
                placeholder={`Responder a ${authorLabel(comment.author)}...`}
                value={replyValue ?? ""}
                onChange={(e) => onReplyValueChange?.(e.target.value)}
              />
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => onSubmitReply?.(comment.id)}
                  disabled={replyBusy || !(replyValue ?? "").trim()}
                  className="rounded-lg bg-primary/10 p-2 text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                  title="Responder"
                >
                  <Send className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button
                  onClick={onCancelReply}
                  className="rounded-lg p-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUser={currentUser}
                  isReply
                  onDelete={onDelete}
                  onReport={onReport}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
