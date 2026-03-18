"use client";

import { useEffect, useState, useMemo } from "react";
import Topbar from "@/components/layout/Topbar";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Project } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Search, Filter, X, BarChart2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatsKPIRow } from "@/components/dashboard/StatsKPIRow";
import { StatusDonutChart } from "@/components/dashboard/StatusDonutChart";
import { BudgetBarChart } from "@/components/dashboard/BudgetBarChart";
import { ProjectsAreaChart } from "@/components/dashboard/ProjectsAreaChart";
import { StatusLegend } from "@/components/ui/status-legend";

interface StatsData {
  total: number;
  statusCounts: { GREEN: number; YELLOW: number; RED: number };
  classificationCounts: { TRADITIONAL: number; AGILE: number; HYBRID: number };
  totalBudget: number;
  avgBudget: number;
  topByBudget: { name: string; budget: number; status: string }[];
  projectsPerMonth: { month: string; projetos: number }[];
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card/40 border border-border backdrop-blur-sm shadow-xl rounded-2xl p-6 transition-all hover:border-primary/20">
      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-6">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-[260px] w-full rounded-2xl bg-muted/20" />;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [filterSort, setFilterSort] = useState("recent");

  useEffect(() => {
    fetchProjects();
    fetchStats();
  }, []);

  const fetchProjects = async (search = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?search=${search}`);
      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/projects/stats");
      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Search filter
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase().trim();
      result = result.filter((p) => {
        const match = 
          p.name.toLowerCase().includes(lowerSearch) || 
          p.manager.toLowerCase().includes(lowerSearch) ||
          p.id.toLowerCase().includes(lowerSearch);
        return match;
      });
      console.log(`[Dashboard] Search for "${lowerSearch}" matched ${result.length} projects.`);
    }

    if (filterStatus !== "all") {
      result = result.filter((p) => p.status === filterStatus);
    }

    if (filterDate === "this_month") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      result = result.filter((p) => new Date(p.createdAt) >= startOfMonth);
    } else if (filterDate === "last_month") {
      const startOfLastMonth = new Date();
      startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
      startOfLastMonth.setDate(1);
      startOfLastMonth.setHours(0, 0, 0, 0);
      const endOfLastMonth = new Date();
      endOfLastMonth.setDate(0);
      endOfLastMonth.setHours(23, 59, 59, 999);
      result = result.filter((p) => {
        const d = new Date(p.createdAt);
        return d >= startOfLastMonth && d <= endOfLastMonth;
      });
    }

    if (filterSort === "recent") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (filterSort === "oldest") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (filterSort === "az") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filterSort === "za") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [projects, filterStatus, filterDate, filterSort, searchTerm]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <Topbar />

      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 lg:max-w-7xl">
        {/* KPI Row */}
        {statsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-2xl bg-muted/20" />
            ))}
          </div>
        ) : stats ? (
          <StatsKPIRow
            total={stats.total}
            green={stats.statusCounts.GREEN}
            yellow={stats.statusCounts.YELLOW}
            red={stats.statusCounts.RED}
            totalBudget={stats.totalBudget}
            avgBudget={stats.avgBudget}
          />
        ) : null}

        {/* Status Legend */}
        {!statsLoading && stats && stats.total > 0 && (
          <div className="flex justify-end mb-4">
            <StatusLegend compact />
          </div>
        )}

        {/* Charts Grid */}
        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        ) : stats && stats.total > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <ChartCard title="Status do Portfólio">
              <StatusDonutChart
                green={stats.statusCounts.GREEN}
                yellow={stats.statusCounts.YELLOW}
                red={stats.statusCounts.RED}
              />
            </ChartCard>

            <ChartCard title="Top 5 por Orçamento">
              <BudgetBarChart data={stats.topByBudget} />
            </ChartCard>

            <ChartCard title="Projetos por Mês">
              <ProjectsAreaChart data={stats.projectsPerMonth} />
            </ChartCard>
          </div>
        ) : null}

        {/* Quick Filters - Stitch Inspired */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-card/30 backdrop-blur-md border border-border p-4 rounded-2xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Pesquisar projetos, gerentes ou IDs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all font-medium"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-2 whitespace-nowrap">Status:</span>
            {['all', 'GREEN', 'YELLOW', 'RED'].map((status) => (
              <button 
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                  filterStatus === status 
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' 
                    : 'bg-background/40 hover:bg-background/60 text-muted-foreground border-border'
                }`}
              >
                {status === 'all' ? 'Todos' : status === 'GREEN' ? 'No Prazo' : status === 'YELLOW' ? 'Em Atenção' : 'Atrasado'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Select value={filterSort} onValueChange={setFilterSort}>
              <SelectTrigger className="w-[140px] bg-background/50 border-border h-10 rounded-xl text-xs font-bold">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recentes</SelectItem>
                <SelectItem value="oldest">Antigos</SelectItem>
                <SelectItem value="az">A-Z</SelectItem>
                <SelectItem value="za">Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between items-center mb-5">
          <p className="text-[13px] font-bold text-muted-foreground pl-1">
            {filteredProjects.length} projeto{filteredProjects.length !== 1 ? "s" : ""} encontrado{filteredProjects.length !== 1 ? "s" : ""}
          </p>
          {filteredProjects.length > 0 && (
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground">
              <BarChart2 className="h-3.5 w-3.5 text-primary" />
              <span>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(
                  filteredProjects.reduce((s, p) => s + (p.budget ?? 0), 0)
                )}{" "}
                em carteira
              </span>
            </div>
          )}
        </div>

        {/* Project Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl bg-muted/20" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card/40 rounded-[32px] border border-border shadow-2xl backdrop-blur-md">
            <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 ring-1 ring-inset ring-primary/20">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-foreground">
              Nenhum projeto encontrado
            </h3>
            <p className="text-muted-foreground mt-2 max-w-sm text-[15px] font-medium leading-relaxed">
              Tente ajustar sua busca ou crie um novo projeto para expandir sua visão estratégica.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
              >
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
