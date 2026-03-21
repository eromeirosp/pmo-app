"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, ChevronDown, ChevronUp, Loader2, Bot, User, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTION_CHIPS = [
  "Resumo executivo do portfólio",
  "Quais projetos estão em risco?",
  "Status geral da semana",
  "Comparar orçamentos dos projetos",
  "Quais decisões foram tomadas recentemente?",
  "Recomendações para os projetos críticos",
];

export function PortfolioAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendQuestion = async (question: string) => {
    if (!question.trim() || loading) return;

    const userMessage: Message = { role: "user", content: question.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao consultar IA");
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setError(msg);
      setMessages((prev) => [...prev, { role: "assistant", content: `Erro: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuestion(input);
  };

  return (
    <div className="mb-8">
      {/* Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all group cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-foreground">Assistente IA do Portfólio</h3>
            <p className="text-[11px] text-muted-foreground">Pergunte sobre seus projetos, riscos, orçamentos e mais</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="mt-3 rounded-2xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden">
          {/* Messages Area */}
          <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-6">
                <Bot className="h-10 w-10 mx-auto text-primary/40 mb-3" />
                <p className="text-sm text-muted-foreground font-medium mb-4">
                  Faça uma pergunta sobre o portfólio ou clique em uma sugestão:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTION_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => sendQuestion(chip)}
                      disabled={loading}
                      className="px-3 py-1.5 text-xs font-medium rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/15 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 text-foreground"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex gap-3 items-start">
                <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="bg-secondary/50 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analisando o portfólio...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion chips after first response */}
          {messages.length > 0 && !loading && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTION_CHIPS.slice(0, 3).map((chip) => (
                <button
                  key={chip}
                  onClick={() => sendQuestion(chip)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-full border border-border bg-background/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-border p-3 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre o portfólio..."
              disabled={loading}
              className="flex-1 bg-background/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50 font-medium"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || loading}
              className="rounded-xl h-10 w-10 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
