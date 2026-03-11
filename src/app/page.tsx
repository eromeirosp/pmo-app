"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Project } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async (search = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?search=${search}`);
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    // Simple debounce would go here for production
    fetchProjects(val);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Topbar title="Portfólio de Projetos" />

      <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-10">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">Seu Portfólio</h2>
            <p className="text-slate-500 mt-1.5 text-base">Acompanhe e gerencie todos os projetos ativos.</p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600/60" />
            <Input
              type="search"
              placeholder="Buscar pelo nome do projeto..."
              className="w-full bg-white pl-10 border-slate-200/80 shadow-sm focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 rounded-lg h-10 transition-all font-medium placeholder:font-normal"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl bg-slate-200" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/20">
            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mb-5 ring-4 ring-white shadow-sm">
              <Search className="h-6 w-6 text-emerald-600/80" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-800">Nenhum projeto encontrado</h3>
            <p className="text-slate-500 mt-2 max-w-sm">
              Tente ajustar sua busca ou inicie a criação de um novo documento de projeto clicando em "Novo Projeto".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
