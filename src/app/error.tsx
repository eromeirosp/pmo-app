"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-6 px-4 text-center">
            <div className="rounded-full bg-red-100 p-4">
                <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">Ops! Algo deu errado.</h2>
                <p className="max-w-md text-slate-500">
                    Não conseguimos processar esta solicitação no momento. O erro já foi registrado pela nossa equipe.
                </p>
            </div>
            <Button 
                onClick={() => reset()}
                className="bg-emerald-600 hover:bg-emerald-700"
            >
                Tentar novamente
            </Button>
        </div>
    );
}
