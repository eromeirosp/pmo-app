import Link from "next/link";
import { Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopbarProps {
    title: string;
}

export function Topbar({ title }: TopbarProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/70 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
                        PMO
                    </div>
                    <h1 className="text-xl font-semibold tracking-tight text-slate-900 hidden sm:inline-block">
                        {title}
                    </h1>
                </Link>
                <div className="flex items-center gap-3">
                    <Link href="/projects/new">
                        <Button size="sm" className="hidden sm:flex bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Projeto
                        </Button>
                        <Button size="icon" className="sm:hidden bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="rounded-full bg-slate-100 text-slate-600">
                        <User className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
