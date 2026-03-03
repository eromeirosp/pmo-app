import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project } from "@prisma/client";
import Link from "next/link";
import { ArrowRight, User } from "lucide-react";

interface ProjectCardProps {
    project: Project;
}

const statusColorMap = {
    GREEN: "bg-emerald-500 hover:bg-emerald-600",
    YELLOW: "bg-amber-500 hover:bg-amber-600",
    RED: "bg-rose-500 hover:bg-rose-600",
};

export function ProjectCard({ project }: ProjectCardProps) {
    const badgeColor = statusColorMap[project.status as keyof typeof statusColorMap] || statusColorMap.GREEN;

    const formattedBudget = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(project.budget);

    return (
        <Link href={`/projects/${project.id}/documents`} className="block group">
            <Card className="h-full transition-all duration-300 hover:shadow-md hover:border-emerald-200 bg-white">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {project.name}
                    </CardTitle>
                    <Badge className={`${badgeColor} text-white shadow-sm border-0 ml-2`}>
                        {project.status === 'GREEN' ? 'No Prazo' : project.status === 'YELLOW' ? 'Atenção' : 'Atrasado'}
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center text-sm text-slate-500 mb-2">
                        <User className="mr-1 h-3 w-3" />
                        <span className="truncate">{project.manager}</span>
                    </div>
                    <div className="text-xl font-bold text-slate-800">
                        {formattedBudget}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        Orçamento
                    </p>
                </CardContent>
                <CardFooter className="flex justify-between items-center border-t border-slate-100 bg-slate-50/50 pt-3 pb-3">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {project.classification?.replace('_', ' ') || 'PROJETO'}
                    </span>
                    <ArrowRight className="h-4 w-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform duration-300" />
                </CardFooter>
            </Card>
        </Link>
    );
}
