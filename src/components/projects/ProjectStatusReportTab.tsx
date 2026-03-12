"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Plus,
  CheckCircle,
  Target,
  Clock,
  Wallet,
  TrendingUp,
  AlertTriangle,
  History,
  FilePlus,
  FileText,
  Loader2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { TabHeader } from "./TabHeader";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface StatusReport {
  id: string;
  projectId: string;
  period: string;
  overallStatus: string;
  scopeStatus: string;
  scheduleStatus: string;
  budgetStatus: string;
  progress: number;
  budgetSpent: number | null;
  accomplishments: string | null;
  nextSteps: string | null;
  issues: string | null;
  reportDate: string;
  createdAt: string;
}

const statusColorClass = (status: string) => {
  if (status.includes("Verde") || status.includes("Prazo") || status.includes("Escopo") || status === "Em Dia" || status === "No Escopo" || status === "No Prazo")
    return "text-emerald-600 dark:text-emerald-400";
  if (status.includes("Amarelo") || status.includes("Atenção") || status.includes("Leve") || status.includes("Mudanças") || status.includes("Acima"))
    return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
};

const statusBadgeClass = (status: string) => {
  if (status.includes("Verde"))
    return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
  if (status.includes("Amarelo"))
    return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
  return "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400";
};

const statusDotColor = (status: string) => {
  if (status.includes("Verde") || status.includes("Prazo") || status.includes("Escopo") || status === "Em Dia" || status === "No Escopo" || status === "No Prazo")
    return "bg-emerald-500";
  if (status.includes("Amarelo") || status.includes("Atenção") || status.includes("Leve") || status.includes("Mudanças") || status.includes("Acima"))
    return "bg-amber-500";
  return "bg-rose-500";
};

const statusLabel = (status: string) => {
  if (status.includes("Verde")) return "SAUDÁVEL";
  if (status.includes("Amarelo")) return "ATENÇÃO";
  return "RISCO";
};

const StatusIcon = ({ status }: { status: string }) => {
  const cls = statusColorClass(status);
  if (status.includes("Verde") || status.includes("Prazo") || status === "Em Dia" || status === "No Escopo" || status === "No Prazo")
    return <CheckCircle className={`w-5 h-5 ${cls}`} />;
  if (status.includes("Amarelo") || status.includes("Atenção") || status.includes("Leve") || status.includes("Mudanças") || status.includes("Acima"))
    return <AlertTriangle className={`w-5 h-5 ${cls}`} />;
  return <AlertTriangle className={`w-5 h-5 ${cls}`} />;
};

const iconForIndicator = (label: string) => {
  if (label === "Status Geral") return CheckCircle;
  if (label === "Escopo") return Target;
  if (label === "Cronograma") return Clock;
  return Wallet;
};

export default function ProjectStatusReportTab({ projectId }: { projectId: string }) {
  const [reports, setReports] = useState<StatusReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Form state
  const [period, setPeriod] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [overallStatus, setOverallStatus] = useState("Verde (Saudável)");
  const [scopeStatus, setScopeStatus] = useState("No Escopo");
  const [scheduleStatus, setScheduleStatus] = useState("No Prazo");
  const [budgetStatus, setBudgetStatus] = useState("Em Dia");
  const [progress, setProgress] = useState(0);
  const [budgetSpent, setBudgetSpent] = useState("");
  const [accomplishments, setAccomplishments] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [issues, setIssues] = useState("");
  const [aiSuggesting, setAiSuggesting] = useState(false);

  const baseUrl = `/api/projects/${projectId}/status-reports`;

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch(baseUrl);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch {
      console.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const resetForm = () => {
    setPeriod("");
    setReportDate("");
    setOverallStatus("Verde (Saudável)");
    setScopeStatus("No Escopo");
    setScheduleStatus("No Prazo");
    setBudgetStatus("Em Dia");
    setProgress(0);
    setBudgetSpent("");
    setAccomplishments("");
    setNextSteps("");
    setIssues("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!period.trim()) {
      toast.error("Informe o período de referência");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period,
          overallStatus,
          scopeStatus,
          scheduleStatus,
          budgetStatus,
          progress,
          budgetSpent: budgetSpent ? parseFloat(budgetSpent) : null,
          accomplishments: accomplishments || null,
          nextSteps: nextSteps || null,
          issues: issues || null,
          reportDate: reportDate || null,
        }),
      });
      if (!res.ok) throw new Error();
      const item = await res.json();
      setReports((prev) => [item, ...prev]);
      resetForm();
      setShowForm(false);
      toast.success("Relatório publicado com sucesso!");
    } catch {
      toast.error("Erro ao salvar relatório");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    setReports((prev) => prev.filter((r) => r.id !== itemId));
    try {
      const res = await fetch(`${baseUrl}?itemId=${itemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Relatório excluído");
    } catch {
      toast.error("Erro ao excluir relatório");
      fetchReports();
    }
  };

  const handleAiSuggest = async () => {
    setAiSuggesting(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, type: "status_report" }),
      });
      if (!res.ok) throw new Error("Erro na IA");
      const data = await res.json();
      if (data.accomplishments) setAccomplishments(typeof data.accomplishments === "string" ? data.accomplishments : JSON.stringify(data.accomplishments));
      if (data.nextSteps) setNextSteps(typeof data.nextSteps === "string" ? data.nextSteps : JSON.stringify(data.nextSteps));
      if (data.issues) setIssues(typeof data.issues === "string" ? data.issues : JSON.stringify(data.issues));
      toast.success("Sugestões da IA aplicadas! Revise antes de salvar.");
    } catch {
      toast.error("Erro ao gerar sugestões com IA.");
    } finally {
      setAiSuggesting(false);
    }
  };

  const handleExport = async () => {
    if (reports.length === 0) {
      toast.error("Nenhum dado para exportar.");
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text("Histórico de Relatórios de Status", 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Projeto ID: ${projectId}`, 14, 30);
      doc.text(`Data de Exportação: ${new Date().toLocaleDateString('pt-BR')}`, 14, 35);

      const tableData = reports.map(report => [
        report.period,
        report.overallStatus,
        report.progress + "%",
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(report.budgetSpent || 0),
        report.reportDate ? new Date(report.reportDate).toLocaleDateString('pt-BR') : "—"
      ]);

      autoTable(doc, {
        startY: 45,
        head: [["Período", "Status Geral", "Progresso", "Gasto", "Data"]],
        body: tableData,
        headStyles: { fillColor: [201, 163, 85], textColor: [255, 255, 255] }, // Compass Gold
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: 45 },
      });

      // Add a second page for detailed content if needed, or just append it below? 
      // For now, let's just do a summary table as it's the most common request for "Export All".
      // If we wanted to export EVERYTHING including descriptions, we'd need a more complex layout.
      
      const filename = `Status_Reports_Projeto_${projectId}.pdf`;
      const pdfData = doc.output('arraybuffer');
      const blob = new Blob([pdfData], { type: 'application/pdf' });

      if ('showSaveFilePicker' in window) {
        const handle = await (window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Erro ao gerar PDF.");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateStr));
  };

  const latest = reports[0];
  const older = reports.slice(1);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectClasses = "w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white dark:focus:bg-slate-800 transition-all duration-200";
  const inputClasses = "w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white dark:focus:bg-slate-800 transition-all duration-200";
  const chevronSvg = (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
    </div>
  );

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full pb-24 px-4 space-y-8 text-left">
      <div className="pt-4">
        <TabHeader
          icon={FileText}
          title="Histórico de Relatórios de Status"
          description="Acompanhe a evolução e saúde do seu projeto"
          actions={
            <>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 rounded-xl h-10 px-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium text-sm transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-white/20 active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-5 h-5" />
                Exportar Tudo
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 rounded-xl h-10 px-4 bg-primary text-white font-medium text-sm shadow-sm hover:shadow-md hover:bg-primary/90 transition-all duration-200 active:scale-[0.98]"
              >
                <Plus className="w-5 h-5" />
                Novo Relatório
              </button>
            </>
          }
        />
      </div>

      {/* Reports History */}
      <section className="grid grid-cols-1 gap-6">
        {/* Most Recent Report */}
        {latest ? (
          <div className="flex flex-col bg-card rounded-xl border border-border shadow-md overflow-hidden">
            <div className="p-6 border-b border-border bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Relatório Recente</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{latest.period}</h3>
                  <p className="text-sm text-slate-500">Publicado em: {formatDate(latest.reportDate)}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${statusBadgeClass(latest.overallStatus)}`}>
                    <span className={`w-2 h-2 rounded-full ${statusDotColor(latest.overallStatus)}`}></span> {statusLabel(latest.overallStatus)}
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Relatório?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O relatório de <strong>{latest.period}</strong> será permanentemente removido.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(latest.id)} className="bg-red-500 hover:bg-red-600 text-white">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Health Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Status Geral", value: latest.overallStatus },
                  { label: "Escopo", value: latest.scopeStatus },
                  { label: "Cronograma", value: latest.scheduleStatus },
                  { label: "Orçamento", value: latest.budgetStatus },
                ].map((ind) => {
                  const Icon = iconForIndicator(ind.label);
                  return (
                    <div key={ind.label} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-slate-500 mb-1">{ind.label}</p>
                      <div className={`flex items-center gap-2 font-bold ${statusColorClass(ind.value)}`}>
                        <Icon className="w-5 h-5" /> {ind.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <TrendingUp className="text-primary w-5 h-5" /> Progresso Geral
                  </h4>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full mb-2">
                    <div className="bg-primary h-3 rounded-full transition-all duration-500" style={{ width: `${latest.progress}%` }}></div>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">{latest.progress}% Concluído</span>
                  </div>
                </div>
                {latest.budgetSpent !== null && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                      <Wallet className="text-primary w-5 h-5" /> Orçamento Gasto
                    </h4>
                    <div className="flex items-end gap-2 mb-1">
                      <span className="text-2xl font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(latest.budgetSpent)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {latest.accomplishments && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-tight text-emerald-600">Realizações no Período</h4>
                      <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">{latest.accomplishments}</div>
                    </div>
                  )}
                  {latest.nextSteps && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-tight text-primary">Próximos Passos</h4>
                      <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">{latest.nextSteps}</div>
                    </div>
                  )}
                </div>
                {latest.issues && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-200 dark:border-amber-800/50">
                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> Problemas / Impedimentos
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-500/80 whitespace-pre-line">{latest.issues}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : !showForm ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-semibold">Nenhum relatório de status ainda</p>
            <p className="text-sm mt-1">Clique em &quot;Novo Relatório&quot; para criar o primeiro</p>
          </div>
        ) : null}

        {/* Older Reports */}
        {older.map((report) => (
          <div key={report.id} className="flex flex-col bg-card rounded-xl border border-border shadow-md opacity-80 transition-opacity hover:opacity-100">
            <div className="p-4 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <History className="w-5 h-5 text-slate-400" />
                <div>
                  <h3 className="font-bold text-slate-700 dark:text-slate-300">{report.period}</h3>
                  <p className="text-xs text-slate-500">Publicado em: {formatDate(report.reportDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  <div className={`w-2 h-2 rounded-full ${statusDotColor(report.overallStatus)}`}></div>
                  <div className={`w-2 h-2 rounded-full ${statusDotColor(report.scopeStatus)}`}></div>
                  <div className={`w-2 h-2 rounded-full ${statusDotColor(report.scheduleStatus)}`}></div>
                  <div className={`w-2 h-2 rounded-full ${statusDotColor(report.budgetStatus)}`}></div>
                </div>
                <button
                  onClick={() => setExpandedReportId(expandedReportId === report.id ? null : report.id)}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  {expandedReportId === report.id ? "Ocultar" : "Ver Detalhes"}
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Relatório?</AlertDialogTitle>
                      <AlertDialogDescription>
                        O relatório de <strong>{report.period}</strong> será permanentemente removido.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(report.id)} className="bg-red-500 hover:bg-red-600 text-white">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            {expandedReportId === report.id && (
              <div className="p-6 border-t border-border space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Status Geral", value: report.overallStatus },
                    { label: "Escopo", value: report.scopeStatus },
                    { label: "Cronograma", value: report.scheduleStatus },
                    { label: "Orçamento", value: report.budgetStatus },
                  ].map((ind) => (
                    <div key={ind.label} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-slate-500 mb-1">{ind.label}</p>
                      <div className={`flex items-center gap-2 font-bold text-sm ${statusColorClass(ind.value)}`}>
                        <StatusIcon status={ind.value} /> {ind.value}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500">Progresso: <strong className="text-primary">{report.progress}%</strong></span>
                  {report.budgetSpent !== null && (
                    <span className="text-slate-500">Gasto: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(report.budgetSpent)}</strong></span>
                  )}
                </div>
                {report.accomplishments && <div><h4 className="text-xs font-bold uppercase text-emerald-600 mb-1">Realizações</h4><p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">{report.accomplishments}</p></div>}
                {report.nextSteps && <div><h4 className="text-xs font-bold uppercase text-primary mb-1">Próximos Passos</h4><p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">{report.nextSteps}</p></div>}
                {report.issues && <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50"><h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-1">Problemas</h4><p className="text-sm text-amber-700 dark:text-amber-500/80 whitespace-pre-line">{report.issues}</p></div>}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* New Report Form */}
      {showForm && (
        <section className="bg-card rounded-xl border border-primary/20 shadow-lg p-8 mt-4 mb-12">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FilePlus className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Novo Relatório de Status</h2>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Período de Referência *</label>
                <input
                  className={inputClasses}
                  placeholder="Ex: Fevereiro 2026"
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Data de Publicação</label>
                <input
                  className={inputClasses}
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status Geral</label>
                <div className="relative">
                  <select className={selectClasses} value={overallStatus} onChange={(e) => setOverallStatus(e.target.value)}>
                    <option>Verde (Saudável)</option>
                    <option>Amarelo (Atenção)</option>
                    <option>Vermelho (Risco)</option>
                  </select>
                  {chevronSvg}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Escopo</label>
                <div className="relative">
                  <select className={selectClasses} value={scopeStatus} onChange={(e) => setScopeStatus(e.target.value)}>
                    <option>No Escopo</option>
                    <option>Com Mudanças</option>
                    <option>Risco de Escopo</option>
                  </select>
                  {chevronSvg}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cronograma</label>
                <div className="relative">
                  <select className={selectClasses} value={scheduleStatus} onChange={(e) => setScheduleStatus(e.target.value)}>
                    <option>No Prazo</option>
                    <option>Atraso Leve</option>
                    <option>Crítico</option>
                  </select>
                  {chevronSvg}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Orçamento</label>
                <div className="relative">
                  <select className={selectClasses} value={budgetStatus} onChange={(e) => setBudgetStatus(e.target.value)}>
                    <option>Em Dia</option>
                    <option>Acima do Previsto</option>
                    <option>Crítico</option>
                  </select>
                  {chevronSvg}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Progresso Concluído (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    className="grow h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    type="range"
                    min={0}
                    max={100}
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                  />
                  <span className="text-sm font-bold text-primary min-w-[3rem] text-right">{progress}%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Orçamento Gasto (R$)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                  <input
                    className={`${inputClasses} pl-11`}
                    placeholder="0,00"
                    type="number"
                    step="0.01"
                    value={budgetSpent}
                    onChange={(e) => setBudgetSpent(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Narrativa do Período</h4>
                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={aiSuggesting}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {aiSuggesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Sugerir com IA
                </button>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Realizações no Período
                </label>
                <textarea
                  className={inputClasses}
                  placeholder="Descreva o que foi alcançado..."
                  rows={3}
                  value={accomplishments}
                  onChange={(e) => setAccomplishments(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Próximos Passos
                </label>
                <textarea
                  className={inputClasses}
                  placeholder="Quais as prioridades para o próximo ciclo?"
                  rows={3}
                  value={nextSteps}
                  onChange={(e) => setNextSteps(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Problemas / Impedimentos</label>
                <textarea
                  className={inputClasses}
                  placeholder="Algum bloqueio detectado?"
                  rows={2}
                  value={issues}
                  onChange={(e) => setIssues(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 active:scale-[0.98]"
                type="button"
                onClick={() => { resetForm(); setShowForm(false); }}
              >
                Cancelar
              </button>
              <button
                className="px-8 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-sm hover:shadow-md hover:bg-primary/90 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</span>
                ) : (
                  "Salvar e Publicar"
                )}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
