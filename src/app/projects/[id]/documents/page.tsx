"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Project, Artifact, Risk } from "@prisma/client";

interface ArtifactContent {
    text?: string;
    items?: Array<{
        description: string;
        probability: number;
        impact: number;
    }>;
}
import Topbar from "@/components/layout/Topbar";
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchProject = async () => {
        try {
            const res = await fetch(`/api/projects/${id}`);
            if (!res.ok) throw new Error("Falha ao buscar projeto");
            const data = await res.json();
            setProject(data);
        } catch (err) {
            console.error("Failed to fetch project:", err);
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
            const contentData = currentArtifact.content as unknown as ArtifactContent;
            const content = contentData.text || JSON.stringify(contentData.items, null, 2) || "";
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
        } catch (err) {
            console.error("Failed to update artifact:", err);
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
            <Topbar />

            <main className="flex-1 container mx-auto px-4 md:px-6 py-8 md:py-10">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar ao Portfólio
                    </Link>
                    <div className="inline-flex items-center justify-center rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 shadow-sm">
                        Orçamento: R$ {project.budget.toLocaleString('pt-BR')}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Tabs */}
                    <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">
                            Documentos de Iniciação
                        </div>
                        <Button
                            variant="ghost"
                            className={`justify-start w-full transition-all duration-200 h-11 px-4 rounded-xl ${
                                activeTab === "BUSINESS_CASE" 
                                    ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-sm ring-1 ring-emerald-200/50' 
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                            }`}
                            onClick={() => { setActiveTab("BUSINESS_CASE"); setEditingContent(null); }}>
                            Business Case (História)
                        </Button>
                        <Button
                            variant="ghost"
                            className={`justify-start w-full transition-all duration-200 h-11 px-4 rounded-xl ${
                                activeTab === "ESCOPO_PRELIMINAR" 
                                    ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-sm ring-1 ring-emerald-200/50' 
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                            }`}
                            onClick={() => { setActiveTab("ESCOPO_PRELIMINAR"); setEditingContent(null); }}>
                            Escopo Preliminar
                        </Button>
                        <Button
                            variant="ghost"
                            className={`justify-start w-full transition-all duration-200 h-11 px-4 rounded-xl ${
                                activeTab === "RISCOS_INICIAIS" 
                                    ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-sm ring-1 ring-emerald-200/50' 
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                            }`}
                            onClick={() => { setActiveTab("RISCOS_INICIAIS"); setEditingContent(null); }}>
                            Riscos & Ameaças
                        </Button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0">
                        <Card className="min-h-[600px] border-slate-200/60 bg-white shadow-sm rounded-2xl flex flex-col overflow-hidden">
                            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 bg-slate-50/50 pb-5 pt-6 px-6 gap-4">
                                <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">
                                    {activeTab === "BUSINESS_CASE" && "Business Case"}
                                    {activeTab === "ESCOPO_PRELIMINAR" && "Escopo Preliminar"}
                                    {activeTab === "RISCOS_INICIAIS" && "Riscos Iniciais"}
                                </CardTitle>
                                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                    {editingContent !== null ? (
                                        <>
                                            <Button variant="ghost" size="sm" className="rounded-full px-4 text-slate-600 hover:bg-slate-200 hover:text-slate-900 font-medium" onClick={() => setEditingContent(null)}>
                                                Cancelar
                                            </Button>
                                            <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-full px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all focus:ring-emerald-500/20">
                                                <Save className="h-4 w-4 mr-2" /> Salvar Alterações
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button variant="outline" size="sm" className="rounded-full px-4 bg-white text-slate-600 hover:text-amber-700 hover:bg-amber-50 border-slate-200 font-medium shadow-sm transition-all" onClick={() => toast.info('Funcionalidade de Rollback será exibida no Histórico')}>
                                                <History className="h-4 w-4 mr-2" /> Histórico
                                            </Button>
                                            <Button size="sm" onClick={handleEdit} className="rounded-full px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all focus:ring-emerald-500/20">
                                                <Edit3 className="h-4 w-4 mr-2" /> Editar Documento
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8 flex-1">
                                {editingContent !== null ? (
                                    <Textarea
                                        value={editingContent}
                                        onChange={(e) => setEditingContent(e.target.value)}
                                        className="min-h-[450px] font-mono text-sm leading-relaxed p-4 rounded-xl border-slate-200 focus-visible:ring-emerald-500/20 shadow-inner resize-y"
                                    />
                                ) : (
                                    <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-p:text-slate-600 prose-headings:text-slate-800 whitespace-pre-wrap">
                                        {currentArtifact ? (
                                            activeTab === "RISCOS_INICIAIS" ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {((currentArtifact.content as unknown as ArtifactContent).items || []).map((r, i: number) => (
                                                        <div key={i} className="flex flex-col gap-2 p-5 rounded-2xl border border-rose-100 bg-rose-50/30 hover:bg-rose-50/60 transition-all">
                                                            <div className="flex items-start gap-3">
                                                                <div className="p-2 bg-rose-100/50 rounded-lg shrink-0">
                                                                    <AlertTriangle className="h-5 w-5 text-rose-600" />
                                                                </div>
                                                                <p className="font-medium text-rose-950 flex-1 leading-snug">{r.description}</p>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-rose-100/50 text-sm">
                                                                <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-200 shadow-sm">
                                                                    Probabilidade: {r.probability}/5
                                                                </span>
                                                                <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-200 shadow-sm">
                                                                    Impacto: {r.impact}/5
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                (currentArtifact.content as unknown as ArtifactContent).text || "Conteúdo não disponível."
                                            )
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                                <div className="rounded-full bg-slate-100 p-4 mb-4">
                                                    <AlertTriangle className="h-8 w-8 text-slate-400" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Documento não gerado</h3>
                                                <p className="text-slate-500 max-w-sm">
                                                    Este artefato ainda não foi gerado ou está em processamento pela IA.
                                                </p>
                                            </div>
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
