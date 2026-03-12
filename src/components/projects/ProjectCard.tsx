import Link from "next/link";
import { User, Calendar, DollarSign, Building2 } from "lucide-react";
import { parseLocalDate } from "@/lib/utils";

interface EAPItemSlim {
    id: string;
    status: string;
}

interface ProjectCardProject {
    id: string;
    name: string;
    manager: string;
    budget: number;
    status: string;
    classification?: string | null;
    impacts?: string | null;
    department?: string | null;
    endDate?: string | Date | null;
    eapItems?: EAPItemSlim[];
}

interface ProjectCardProps {
    project: ProjectCardProject;
}

const statusColorMap = {
    GREEN: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400",
    YELLOW: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400",
    RED: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400",
};

export function ProjectCard({ project }: ProjectCardProps) {
    const badgeColor = statusColorMap[project.status as keyof typeof statusColorMap] || statusColorMap.GREEN;

    const formattedBudget = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(project.budget);

    const eapItems = project.eapItems || [];
    const totalItems = eapItems.length;
    const doneItems = eapItems.filter((i) => i.status === "DONE").length;
    const progressPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

    const formattedEndDate = project.endDate
        ? new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(parseLocalDate(project.endDate))
        : "Sem prazo";

    return (
        <Link href={`/projects/${project.id}`} className="block group h-full">
            <div className="h-full flex flex-col p-6 bg-card border border-border rounded-2xl shadow-md transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 relative overflow-hidden">
                {/* Accent Gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <h4 className="text-[18px] font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight mb-3">
                    {project.name}
                </h4>

                <div className="flex items-center gap-2 mb-5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${badgeColor}`}>
                        {project.status === 'GREEN' ? 'No Prazo' : project.status === 'YELLOW' ? 'Em Atenção' : 'Atrasado'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border border-border text-muted-foreground bg-secondary">
                        {project.classification?.replace('_', ' ') || 'PROJETO'}
                    </span>
                </div>

                <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed mb-6 font-medium">
                    {project.impacts || "Inovação tecnológica e excelência operacional para entrega de resultados extraordinários."}
                </p>

                <div className="space-y-4 mt-auto">
                    {/* Progress */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            <span>Progresso</span>
                            <span className="text-muted-foreground">{totalItems > 0 ? `${progressPct}%` : "Sem EAP"}</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(255,191,0,0.4)] transition-all duration-500"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    </div>

                    <ul className="grid grid-cols-2 gap-3 pt-2">
                        <li className="flex items-center gap-2.5 text-muted-foreground">
                            <User className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-[12px] font-medium truncate">{project.manager}</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-muted-foreground">
                            <DollarSign className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-[12px] font-medium truncate">{formattedBudget}</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-[12px] font-medium truncate">{formattedEndDate}</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-[12px] font-medium truncate">{project.department || "Geral"}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </Link>
    );
}
