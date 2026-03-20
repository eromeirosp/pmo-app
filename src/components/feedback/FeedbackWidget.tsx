"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MessageSquarePlus,
  X,
  Bug,
  Lightbulb,
  Puzzle,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

const TICKET_TYPES = [
  { value: "BUG", label: "Correção", icon: Bug, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
  { value: "IMPROVEMENT", label: "Melhoria", icon: Lightbulb, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { value: "FEATURE", label: "Novo Recurso", icon: Puzzle, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
] as const;

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [type, setType] = useState<string>("BUG");
  const [description, setDescription] = useState("");
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          setImageBlob(blob);
          const reader = new FileReader();
          reader.onload = () => setImagePreview(reader.result as string);
          reader.readAsDataURL(blob);
        }
        break;
      }
    }
  };

  const removeImage = () => {
    setImageBlob(null);
    setImagePreview(null);
  };

  const resetForm = () => {
    setType("BUG");
    setDescription("");
    setImageBlob(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!userName.trim()) {
      toast.error("Informe seu nome.");
      return;
    }
    if (!description.trim()) {
      toast.error("Descreva o feedback.");
      return;
    }

    setLoading(true);
    try {
      let screenshotBase64: string | null = null;
      if (imageBlob) {
        screenshotBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(imageBlob);
        });
      }

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: userName.trim(),
          type,
          description: description.trim(),
          currentPath: window.location.pathname + window.location.search,
          screenshotBase64,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Feedback enviado com sucesso!");
      resetForm();
      setOpen(false);
    } catch {
      toast.error("Erro ao enviar feedback.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none px-4 py-2.5 text-foreground placeholder:text-muted-foreground/60 transition-all text-sm";

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-3.5 bg-primary text-primary-foreground rounded-full shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-110 transition-all duration-300 group"
        aria-label="Enviar feedback"
      >
        <MessageSquarePlus className="h-5 w-5 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={(v) => !loading && setOpen(v)}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-xl">
          <DialogHeader className="p-6 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-lg">
                <MessageSquarePlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Enviar Feedback</DialogTitle>
                <DialogDescription className="text-xs">
                  Reporte bugs, sugira melhorias ou peça novos recursos.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Seu Nome <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className={inputClass}
                placeholder="Como devemos te chamar?"
              />
            </div>

            {/* Type Selection */}
            <div>
              <label className="block text-sm font-semibold mb-2">Tipo</label>
              <div className="grid grid-cols-3 gap-2">
                {TICKET_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                        type === t.value
                          ? `${t.color} border-current shadow-md`
                          : "text-muted-foreground border-border hover:border-primary/30"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Descrição <span className="text-destructive">*</span>
              </label>
              <textarea
                ref={textareaRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onPaste={handlePaste}
                className={`${inputClass} resize-y`}
                rows={3}
                placeholder={
                  type === "BUG"
                    ? "Descreva o problema encontrado..."
                    : type === "IMPROVEMENT"
                    ? "O que poderia ser melhorado?"
                    : "Descreva o recurso desejado..."
                }
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Ctrl+V para colar screenshot
              </p>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Screenshot"
                  className="h-24 rounded-lg border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full shadow-lg"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-muted/30 border-t border-border/50 flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="font-semibold"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Feedback"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
