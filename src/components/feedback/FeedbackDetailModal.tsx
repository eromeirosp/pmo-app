"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Bug,
  Lightbulb,
  Puzzle,
  ThumbsUp,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { TicketData } from "./FeedbackCard";

const typeConfig: Record<string, { icon: typeof Bug; label: string }> = {
  BUG: { icon: Bug, label: "Correção" },
  IMPROVEMENT: { icon: Lightbulb, label: "Melhoria" },
  FEATURE: { icon: Puzzle, label: "Novo Recurso" },
};

const STATUSES = ["Backlog", "Em Análise", "Priorizado", "Em Execução", "Concluído"];

interface FeedbackDetailModalProps {
  ticket: TicketData | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function FeedbackDetailModal({ ticket, open, onClose, onUpdate }: FeedbackDetailModalProps) {
  const [commentText, setCommentText] = useState("");
  const [commentName, setCommentName] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [liking, setLiking] = useState(false);

  if (!ticket) return null;

  const tConfig = typeConfig[ticket.type] || typeConfig.BUG;
  const TypeIcon = tConfig.icon;

  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ticket.createdAt));

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Status atualizado para ${newStatus}`);
      onUpdate();
    } catch {
      toast.error("Erro ao atualizar status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleLike = async () => {
    setLiking(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggleLike: commentName || "Anônimo" }),
      });
      if (!res.ok) throw new Error();
      onUpdate();
    } catch {
      toast.error("Erro ao registrar voto.");
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSendingComment(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: commentName.trim() || "Anônimo",
          text: commentText.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      setCommentText("");
      toast.success("Comentário adicionado.");
      onUpdate();
    } catch {
      toast.error("Erro ao adicionar comentário.");
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !sendingComment && !updatingStatus && (v ? null : onClose())}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-lg">
              <TypeIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                {tConfig.label}
                <span className="text-xs font-normal text-muted-foreground">
                  por {ticket.userName}
                </span>
              </DialogTitle>
              <p className="text-xs text-muted-foreground">{formattedDate} &middot; {ticket.currentPath}</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Status */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={updatingStatus || ticket.status === s}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      ticket.status === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary/30"
                    } disabled:opacity-50`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Descrição
              </label>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            {/* Screenshot */}
            {ticket.screenshotUrl && (
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Screenshot
                </label>
                <img
                  src={ticket.screenshotUrl}
                  alt="Screenshot"
                  className="max-w-full rounded-xl border border-border"
                />
              </div>
            )}

            {/* Like */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLike}
                disabled={liking}
                className="gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                {ticket.likes.length}
              </Button>
            </div>

            {/* Comments */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                Comentários ({ticket.comments.length})
              </label>

              {ticket.comments.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {ticket.comments.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-foreground">{c.userName}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Intl.DateTimeFormat("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(c.createdAt))}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">Nenhum comentário ainda.</p>
              )}

              {/* Add Comment */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  placeholder="Seu nome (opcional)"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleComment()}
                    placeholder="Adicionar comentário..."
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <Button
                    size="sm"
                    onClick={handleComment}
                    disabled={sendingComment || !commentText.trim()}
                    className="px-3"
                  >
                    {sendingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
