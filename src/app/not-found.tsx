import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
            <div className="rounded-full bg-slate-100 p-6 shadow-sm border border-slate-200">
                <FileQuestion className="h-12 w-12 text-slate-400" />
            </div>
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-800">Página não encontrada</h2>
                <p className="max-w-md text-slate-500">
                    O documento ou projeto que você está procurando não existe ou foi removido do portfólio.
                </p>
            </div>
            <Link href="/">
                <Button className="bg-emerald-600 hover:bg-emerald-700 mt-4 h-11 px-8">
                    Voltar ao Portfólio
                </Button>
            </Link>
        </div>
    );
}
