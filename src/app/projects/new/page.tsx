"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function NewProjectForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        manager: "",
        budget: "",
        stakeholders: "",
        problems: "",
        returns: "",
        impacts: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.budget || !formData.problems) {
            toast.error("Preencha ao menos Nome, Orçamento e Problemas.");
            return;
        }

        setLoading(true);
        toast.info("A IA está analisando seu projeto... isso pode levar alguns segundos.");

        try {
            const aiResponse = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!aiResponse.ok) {
                throw new Error("Falha na análise da IA");
            }

            const aiResult = await aiResponse.json();

            const finalProjectPayload = {
                ...formData,
                classification: aiResult.classification,
                businessCase: aiResult.businessCase,
                preliminaryScope: aiResult.preliminaryScope,
                initialRisks: aiResult.initialRisks
            };

            const projectResponse = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalProjectPayload),
            });

            const projectData = await projectResponse.json();

            if (!projectResponse.ok) {
                throw new Error(projectData.error || "Erro ao salvar o projeto");
            }

            toast.success("Projeto criado com sucesso!");
            router.push(`/projects/${projectData.id}/documents`);

        } catch (error) {
            console.error(error);
            const err = error as Error;
            toast.error(err.message || "Ocorreu um erro inesperado.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto py-10">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-300">
                {/* Modal Header */}
                <div className="bg-violet-600 p-6 text-white flex items-center gap-3">
                    <Sparkles className="w-8 h-8" />
                    <h2 className="text-xl font-bold">Criar Novo Projeto com IA</h2>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">
                        {/* Info Box */}
                        <div className="bg-violet-600/5 border border-violet-600/30 rounded-lg p-4 flex items-start gap-4">
                            <Info className="w-6 h-6 text-violet-600 shrink-0" />
                            <div>
                                <p className="font-bold text-violet-600">Preenchimento Inteligente</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">A IA analisará as informações fornecidas para sugerir cronogramas, recursos e riscos potenciais.</p>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-full">
                                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Nome do Projeto <span className="text-rose-500">*</span></label>
                                <input 
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none px-4 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all" 
                                    placeholder="Ex: Expansão de Mercado 2024" 
                                    type="text"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Gerente do Projeto</label>
                                <input 
                                    name="manager"
                                    value={formData.manager}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none px-4 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all" 
                                    placeholder="Selecione o responsável" 
                                    type="text"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Orçamento (R$) <span className="text-rose-500">*</span></label>
                                <input 
                                    name="budget"
                                    value={formData.budget}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none px-4 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all" 
                                    placeholder="0,00" 
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Stakeholders Principais</label>
                            <textarea 
                                name="stakeholders"
                                value={formData.stakeholders}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none px-4 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all resize-y" 
                                placeholder="Ex: Diretoria Financeira, Time de Marketing..." 
                                rows={2}
                            ></textarea>
                        </div>

                        {/* Context Section */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="text-base font-bold mb-4 text-slate-900 dark:text-slate-100">Objetivos e Contexto</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Problemas a serem resolvidos <span className="text-rose-500">*</span></label>
                                    <textarea 
                                        name="problems"
                                        value={formData.problems}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none px-4 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all resize-y" 
                                        placeholder="Descreva os desafios atuais..." 
                                        rows={2}
                                        required
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Benefícios Esperados</label>
                                    <textarea 
                                        name="returns"
                                        value={formData.returns}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none px-4 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all resize-y" 
                                        placeholder="O que o projeto deve alcançar?" 
                                        rows={2}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-full">
                                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Impactos de Não Solução</label>
                                <input 
                                    name="impacts"
                                    value={formData.impacts}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none px-4 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all" 
                                    placeholder="Riscos se nada for feito" 
                                    type="text"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row-reverse gap-3 rounded-b-xl border-t border-slate-200 dark:border-slate-800">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-slate-900 dark:bg-primary text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed min-w-[200px]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Criar Projeto com IA
                                </>
                            )}
                        </button>
                        <Link href="/" className="bg-transparent text-slate-600 dark:text-slate-400 font-semibold py-3 px-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-center border border-transparent">
                            Cancelar
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
