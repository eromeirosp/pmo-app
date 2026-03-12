import Link from "next/link";
import { User } from "lucide-react";
import { ThemeToggle } from './ThemeToggle';
import { Button } from "@/components/ui/button";
import { CreateProjectButton } from "@/components/projects/CreateProjectModal";

export default function Topbar() {
    return (
        <header className="sticky top-0 z-50 w-full bg-background/80 dark:bg-black/80 backdrop-blur-xl border-b border-border transition-colors duration-300">
            <div className="container mx-auto flex min-h-[92px] pt-10 pb-3 sm:pt-0 sm:pb-0 sm:h-[72px] items-center justify-between px-4 md:px-8 lg:max-max-w-7xl">
                <Link href="/" className="flex flex-col transition-opacity hover:opacity-80">
                    <h1 className="text-xl font-bold tracking-tight text-foreground dark:text-white leading-none">
                        Projects AI/R Documents
                    </h1>
                    <span className="text-[11px] font-bold text-muted-foreground mt-1.5 uppercase tracking-widest">
                        Gestão de documentos de projetos
                    </span>
                </Link>

                <div className="flex items-center gap-3 sm:gap-4">
                    <ThemeToggle />

                    <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground hover:text-foreground rounded-full hover:bg-accent/50">
                        <User className="h-5 w-5" />
                    </Button>

                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-accent/30 text-[12px] font-bold text-muted-foreground">
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span>Usuário Regular</span>
                    </div>

                    <CreateProjectButton />
                </div>
            </div>
        </header>
    );
}
