import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-emerald-600">
            <Loader2 className="h-10 w-10 animate-spin" />
            <h2 className="text-xl font-semibold">Carregando informações...</h2>
            <p className="text-sm text-emerald-800/60">
                Aguarde um instante, o PMO Master está organizando os dados.
            </p>
        </div>
    );
}
