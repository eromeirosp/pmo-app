import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project } from "@prisma/client";
import Link from "next/link";
import { ArrowRight, User } from "lucide-react";

interface ProjectCardProps {
    project: Project;
}

const statusColorMap = {
    GREEN: "bg-emerald-100 text-emerald-800 border-emerald-200",
    YELLOW: "bg-amber-100 text-amber-800 border-amber-200",
    RED: "bg-rose-100 text-rose-800 border-rose-200",
};

export function ProjectCard({ project }: ProjectCardProps) {
    const badgeColor = statusColorMap[project.status as keyof typeof statusColorMap] || statusColorMap.GREEN;

    const formattedBudget = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(project.budget);

    return (
        <Link href={`/projects/${project.id}/documents`} className="block group">
            <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-200/60 bg-white group-hover:bg-slate-50/30">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                    <CardTitle className="text-base font-semibold tracking-tight text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-2">
                        {project.name}
                    </CardTitle>
                    <Badge className={`${badgeColor} shadow-none border ml-3 px-2.5 py-0.5 whitespace-nowrap`}>
                        {project.status === 'GREEN' ? 'No Prazo' : project.status === 'YELLOW' ? 'Atenção' : 'Atrasado'}
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center text-sm text-slate-500 mb-3 bg-slate-50 py-1.5 px-2.5 rounded-md inline-flex w-fit max-w-full">
                        <User className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{project.manager}</span>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-400 mb-0.5">
                            Orçamento Aprovado
                        </p>
                        <div className="text-xl font-bold tracking-tight text-slate-800">
                            {formattedBudget}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center border-t border-slate-100 bg-white pt-4 pb-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded">
                        {project.classification?.replace('_', ' ') || 'PROJETO'}
                    </span>
                    <ArrowRight className="h-4 w-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-3 group-hover:translate-x-0" />
                </CardFooter>
            </Card>
        </Link>
    );
}

