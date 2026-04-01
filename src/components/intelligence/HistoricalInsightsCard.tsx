"use client";

import { useEffect, useState } from "react";
import { History, BookOpen, TrendingDown, Lightbulb } from "lucide-react";

interface HistoricalAlert {
  ruleKey: string;
  evidence: {
    similarProjectCount?: number;
    avgHistoricalScore?: number;
    threshold?: number;
    similarProjects?: { name: string; score: number | null }[];
    relevantLessons?: string[];
    matchCriteria?: string;
  };
}

interface HistoricalInsightsCardProps {
  projectId: string;
}

export function HistoricalInsightsCard({ projectId }: HistoricalInsightsCardProps) {
  const [alert, setAlert] = useState<HistoricalAlert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/health`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.alerts) {
          const hist = data.alerts.find(
            (a: { ruleKey: string }) => a.ruleKey === "historical_benchmark"
          );
          setAlert(hist || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading || !alert) return null;

  const { evidence } = alert;
  const similarProjects = evidence.similarProjects || [];
  const lessons = evidence.relevantLessons || [];

  return (
    <div className="mt-6 p-5 rounded-2xl border border-amber-200 dark:border-amber-700/30 bg-amber-50/50 dark:bg-amber-900/10">
      <div className="flex items-center gap-2 mb-3">
        <History className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">
          Inteligência Cross-Projeto
        </h3>
      </div>

      <p className="text-xs text-amber-700 dark:text-amber-400 mb-4">
        Baseado em {evidence.similarProjectCount} projeto{evidence.similarProjectCount !== 1 ? "s" : ""} encerrado{evidence.similarProjectCount !== 1 ? "s" : ""} ({evidence.matchCriteria}),
        o health score médio foi de <strong>{evidence.avgHistoricalScore}/100</strong>.
      </p>

      {/* Similar projects */}
      {similarProjects.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Projetos Comparados
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {similarProjects.map((p, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-white/70 dark:bg-black/20 border border-amber-200 dark:border-amber-700/20 rounded-lg px-2.5 py-1"
              >
                <span className="text-amber-800 dark:text-amber-300">{p.name}</span>
                {p.score !== null && (
                  <span className={`font-bold ${p.score >= 70 ? "text-emerald-600" : p.score >= 40 ? "text-amber-600" : "text-rose-600"}`}>
                    {p.score}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Lessons learned */}
      {lessons.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Lições Aprendidas Relevantes
            </span>
          </div>
          <ul className="space-y-1.5">
            {lessons.map((lesson, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                <BookOpen className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
                <span>{lesson}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
