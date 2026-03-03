"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
            // 1. Send data to AI route to get the automated artifacts
            const aiResponse = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!aiResponse.ok) {
                throw new Error("Falha na análise da IA");
            }

            const aiResult = await aiResponse.json();

            // 2. Combine Form Data with AI Result and save the project
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

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Ocorreu um erro inesperado.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Topbar title="Abertura de Projeto" />

            <main className="flex-1 container mx-auto px-4 md:px-6 py-8 max-w-3xl">
                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar ao Portfólio
                    </Link>
                </div>

                <Card className="border-emerald-100 shadow-sm">
                    <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-8">
                        <CardTitle className="text-2xl text-emerald-950 flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-emerald-500" />
                            As 7 Perguntas Fundamentais
                        </CardTitle>
                        <CardDescription className="text-emerald-800/80 text-base mt-2">
                            Preencha os dados abaixo. Nossa IA Master estruturará o Business Case, Escopo e Riscos Iniciais automaticamente com base nas suas respostas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">1. Nome do Projeto <span className="text-red-500">*</span></Label>
                                    <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: Migração Cloud V2" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="manager">2. Gerente do Projeto</Label>
                                    <Input id="manager" name="manager" value={formData.manager} onChange={handleChange} placeholder="Ex: Ana Silva" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="budget">3. Orçamento Aprovado (R$) <span className="text-red-500">*</span></Label>
                                    <Input id="budget" name="budget" type="number" min="0" step="0.01" value={formData.budget} onChange={handleChange} placeholder="Ex: 500000" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stakeholders">4. Principais Stakeholders</Label>
                                    <Input id="stakeholders" name="stakeholders" value={formData.stakeholders} onChange={handleChange} placeholder="Ex: CTO, Diretoria Financeira" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="problems">5. Que problemas o projeto resolverá? <span className="text-red-500">*</span></Label>
                                <Textarea id="problems" name="problems" value={formData.problems} onChange={handleChange} placeholder="Descreva os gargalos ou dores atuais..." className="min-h-24 resize-y" required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="returns">6. Retornos Esperados (ROI/Valor)</Label>
                                <Textarea id="returns" name="returns" value={formData.returns} onChange={handleChange} placeholder="Ex: Redução de custo em 20%, aumento de receita..." className="min-h-24 resize-y" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="impacts">7. Impactos (O que muda ou para quem muda?)</Label>
                                <Textarea id="impacts" name="impacts" value={formData.impacts} onChange={handleChange} placeholder="Ex: Automação completa do setor fiscal..." className="min-h-24 resize-y" />
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-end">
                                <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Analisando e Gerando...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-5 w-5" />
                                            Gerar Projeto com IA
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
