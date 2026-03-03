"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Project, Artifact, Risk } from "@prisma/client";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit3, History, Save, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";

export default function DocumentCenter() {
    const { id } = useParams() as { id: string };
    const [project, setProject] = useState<Project & { artifacts: Artifact[]; risks: Risk[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("BUSINESS_CASE");
    const [editingContent, setEditingContent] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProject();
    }, [id]);

    const fetchProject = async () => {
        try {
            const res = await fetch(`/api/projects/${id}`);
            if (!res.ok) throw new Error("Falha ao buscar projeto");
            const data = await res.json();
            setProject(data);
        } catch (error) {
            toast.error("Erro ao carregar o projeto");
        } finally {
            setLoading(false);
        }
    };

    const getActiveArtifact = () => {
        return project?.artifacts.find(a => a.type === activeTab);
    };

    const currentArtifact = getActiveArtifact();

    const handleEdit = () => {
        if (currentArtifact) {
            // Simple extraction based on our JSON structure
            const content = (currentArtifact.content as any).text || JSON.stringify((currentArtifact.content as any).items, null, 2) || "";
            setEditingContent(content);
        }
    };

    const handleSave = async () => {
        if (!currentArtifact) return;

        setSaving(true);
        try {
            const newContentJson = activeTab === "RISCOS_INICIAIS"
                ? { items: JSON.parse(editingContent || "[]") }
                : { text: editingContent };

            const res = await fetch(`/api/artifacts`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    artifactId: currentArtifact.id,
                    projectId: id,
                    newContent: newContentJson
                })
            });

            if (!res.ok) throw new Error("Falha ao salvar");

            toast.success("Artefato atualizado e versão anterior guardada via Rollback.");
            setEditingContent(null);
            fetchProject(); // Refresh DB state
        } catch (error) {
            toast.error("Erro ao atualizar o documento. Verifique a formatação.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col bg-slate-50 p-8">
                <Skeleton className="h-10 w-32 mb-8 bg-slate-200" />
                <Skeleton className="h-12 w-full max-w-lg mb-6 bg-slate-200" />
                <Skeleton className="h-[400px] w-full bg-slate-200 rounded-xl" />
            </div>
        )
    }

    if (!project) return <div>Projeto não encontrado</div>;

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Topbar title={`Centro de Documentos - ${project.name}`} />

            <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <Link href="/" className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar ao Portfólio
                    </Link>
                    <div className="text-sm font-bold text-slate-500 uppercase">
                        Orçamento: R$ {project.budget.toLocaleString('pt-BR')}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar Tabs */}
                    <div className="w-full lg:w-64 flex flex-col gap-2">
                        <Button
                            variant={activeTab === "BUSINESS_CASE" ? "default" : "outline"}
                            className={`justify-start ${activeTab === "BUSINESS_CASE" ? 'bg-emerald-600' : ''}`}
                            onClick={() => { setActiveTab("BUSINESS_CASE"); setEditingContent(null); }}>
                            Business Case (História)
                        </Button>
                        <Button
                            variant={activeTab === "ESCOPO_PRELIMINAR" ? "default" : "outline"}
                            className={`justify-start ${activeTab === "ESCOPO_PRELIMINAR" ? 'bg-emerald-600' : ''}`}
                            onClick={() => { setActiveTab("ESCOPO_PRELIMINAR"); setEditingContent(null); }}>
                            Escopo Preliminar
                        </Button>
                        <Button
                            variant={activeTab === "RISCOS_INICIAIS" ? "default" : "outline"}
                            className={`justify-start ${activeTab === "RISCOS_INICIAIS" ? 'bg-emerald-600' : ''}`}
                            onClick={() => { setActiveTab("RISCOS_INICIAIS"); setEditingContent(null); }}>
                            Riscos & Ameaças
                        </Button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        <Card className="min-h-[500px] border-emerald-100 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-emerald-50 bg-white pb-4">
                                <CardTitle className="text-xl text-slate-800">
                                    {activeTab.replace("_", " ")}
                                </CardTitle>
                                <div className="flex gap-2">
                                    {editingContent !== null ? (
                                        <>
                                            <Button variant="ghost" size="sm" onClick={() => setEditingContent(null)}>Cancelar</Button>
                                            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                                                <Save className="h-4 w-4 mr-2" /> Salvar
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button variant="outline" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => toast.info('Funcionalidade de Rollback será exibida no Histórico')}>
                                                <History className="h-4 w-4 mr-2" /> Rollback
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={handleEdit} className="text-emerald-700 hover:bg-emerald-50 border-emerald-200">
                                                <Edit3 className="h-4 w-4 mr-2" /> Editar Documento
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 bg-white/50">
                                {editingContent !== null ? (
                                    <Textarea
                                        value={editingContent}
                                        onChange={(e) => setEditingContent(e.target.value)}
                                        className="min-h-[400px] font-mono text-sm leading-relaxed"
                                    />
                                ) : (
                                    <div className="prose max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {currentArtifact ? (
                                            activeTab === "RISCOS_INICIAIS" ? (
                                                <ul className="space-y-4">
                                                    {((currentArtifact.content as any).items || []).map((r: any, i: number) => (
                                                        <li key={i} className="flex items-start gap-3 p-4 rounded-lg border border-rose-100 bg-rose-50/50">
                                                            <AlertTriangle className="h-5 w-5 text-rose-500 mt-0.5" />
                                                            <div>
                                                                <p className="font-medium text-rose-900">{r.description}</p>
                                                                <div className="flex gap-4 mt-2 text-sm text-rose-700">
                                                                    <span>Probabilidade: <strong className="font-bold">{r.probability}/5</strong></span>
                                                                    <span>Impacto: <strong className="font-bold">{r.impact}/5</strong></span>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                (currentArtifact.content as any).text || "Conteúdo não disponível."
                                            )
                                        ) : (
                                            "Artefato não gerado ou em processamento."
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
