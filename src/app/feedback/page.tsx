"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { FeedbackCard, type TicketData } from "@/components/feedback/FeedbackCard";
import { FeedbackDetailModal } from "@/components/feedback/FeedbackDetailModal";
import Topbar from "@/components/layout/Topbar";
import {
  Search,
  Bug,
  Lightbulb,
  Puzzle,
  MessageSquarePlus,
  ArrowLeft,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

const TYPE_FILTERS = [
  { value: "BUG", label: "Correção", icon: Bug, color: "text-rose-500" },
  { value: "IMPROVEMENT", label: "Melhoria", icon: Lightbulb, color: "text-amber-500" },
  { value: "FEATURE", label: "Novo Recurso", icon: Puzzle, color: "text-blue-500" },
];

const STATUSES = ["Backlog", "Em Análise", "Priorizado", "Em Execução", "Concluído"];

export default function FeedbackPage() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/tickets");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTickets(data);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const toggleTypeFilter = (type: string) => {
    setFilterTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const filteredTickets = useMemo(() => {
    let result = [...tickets];

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(lower) ||
          t.userName.toLowerCase().includes(lower)
      );
    }

    if (filterTypes.length > 0) {
      result = result.filter((t) => filterTypes.includes(t.type));
    }

    if (filterStatus !== "all") {
      result = result.filter((t) => t.status === filterStatus);
    }

    return result;
  }, [tickets, searchTerm, filterTypes, filterStatus]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of STATUSES) {
      counts[s] = tickets.filter((t) => t.status === s).length;
    }
    return counts;
  }, [tickets]);

  const handleOpenTicket = (ticket: TicketData) => {
    setSelectedTicket(ticket);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedTicket(null);
  };

  const handleTicketUpdate = () => {
    fetchTickets().then(() => {
      // Sync selectedTicket with updated data
      if (selectedTicket) {
        const updated = tickets.find((t) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Topbar />

      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 lg:max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-xl border border-border hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                <MessageSquarePlus className="h-6 w-6 text-primary" />
                Feedback & Suporte
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} registrado{tickets.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="hidden md:flex items-center gap-2">
            {STATUSES.map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-border text-muted-foreground bg-muted/30"
              >
                {s}: {statusCounts[s] || 0}
              </span>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-card/30 backdrop-blur-md border border-border p-4 rounded-2xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Pesquisar feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-1 whitespace-nowrap">
              Tipo:
            </span>
            {TYPE_FILTERS.map((tf) => {
              const Icon = tf.icon;
              const active = filterTypes.includes(tf.value);
              return (
                <button
                  key={tf.value}
                  onClick={() => toggleTypeFilter(tf.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                      : "bg-background/40 hover:bg-background/60 text-muted-foreground border-border"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {tf.label}
                </button>
              );
            })}
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px] bg-background/50 border-border h-10 rounded-xl text-xs font-bold">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Count */}
        <p className="text-[13px] font-bold text-muted-foreground pl-1 mb-5">
          {filteredTickets.length} de {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
        </p>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-52 w-full rounded-2xl bg-muted/20" />
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card/40 rounded-[32px] border border-border shadow-2xl backdrop-blur-md">
            <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 ring-1 ring-inset ring-primary/20">
              <MessageSquarePlus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-foreground">
              Nenhum feedback encontrado
            </h3>
            <p className="text-muted-foreground mt-2 max-w-sm text-[15px] font-medium">
              Use o botão no canto inferior direito para enviar o primeiro feedback.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
              >
                <FeedbackCard
                  ticket={ticket}
                  onClick={() => handleOpenTicket(ticket)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <FeedbackDetailModal
        ticket={selectedTicket}
        open={modalOpen}
        onClose={handleModalClose}
        onUpdate={handleTicketUpdate}
      />
    </div>
  );
}
