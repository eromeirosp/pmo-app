import Link from "next/link";
import { Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopbarProps {
    title: string;
}

export function Topbar({ title }: TopbarProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/70 backdrop-blur-xl shadow-sm">
            <div className="container mx-auto flex h-[72px] items-center justify-between px-4 md:px-8">
                <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold shadow-sm shadow-emerald-500/20">
                        PMO
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-800 hidden sm:inline-block">
                        {title}
                    </h1>
                </Link>
                <div className="flex items-center gap-3">
                    <Link href="/projects/new">
                        <Button size="sm" className="hidden sm:flex bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4 rounded-lg shadow-sm transition-all hover:shadow-emerald-600/20 hover:-translate-y-0.5">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Projeto
                        </Button>
                        <Button size="icon" className="sm:hidden bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>
                    <Button variant="ghost" size="icon" className="rounded-full bg-slate-100/80 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors">
                        <User className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
