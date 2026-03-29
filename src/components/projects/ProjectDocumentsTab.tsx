"use client";

import { useState, useCallback } from "react";
import { Project, Artifact } from "@prisma/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Edit3,
  Save,
  Sparkles,
  Loader2,
  FileText,
  CheckCircle2,
  Clock,
  Shield,
  Star,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  DOCUMENT_CATALOG,
  type ProjectClassification,
} from "@/lib/ai-document-prompts";

interface ArtifactContent {
  text?: string;
  items?: Array<{ description: string; probability: number; impact: number }>;
}

interface ProjectDocumentsTabProps {
  project: Project & { artifacts: Artifact[] };
  activeDocumentType: string;
  onProjectUpdate: () => void;
}

export function ProjectDocumentsTab({
  project,
  activeDocumentType,
  onProjectUpdate,
}: ProjectDocumentsTabProps) {
  const [editingContent, setEditingContent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const classification = (project.classification || "TRADITIONAL") as ProjectClassification;

  const currentArtifact = project.artifacts.find((a) => a.type === activeDocumentType);
  const currentCatalogEntry = DOCUMENT_CATALOG.find((d) => d.type === activeDocumentType);

  const getRequirementLevel = useCallback(
    (entry: (typeof DOCUMENT_CATALOG)[number]) => {
      return entry.requirements[classification] || "DESIRABLE";
    },
    [classification]
  );

  const handleEdit = () => {
    if (currentArtifact) {
      const contentData = currentArtifact.content as unknown as ArtifactContent;
      const content =
        contentData.text ||
        JSON.stringify(contentData.items, null, 2) ||
        "";
      setEditingContent(content);
    }
  };

  const handleSave = async () => {
    if (!currentArtifact) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/artifacts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artifactId: currentArtifact.id,
          projectId: project.id,
          newContent: { text: editingContent },
        }),
      });
      if (!res.ok) throw new Error("Falha ao salvar");
      toast.success("Documento atualizado com sucesso.");
      setEditingContent(null);
      onProjectUpdate();
    } catch {
      toast.error("Erro ao atualizar o documento.");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/documents/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: activeDocumentType }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error || "Erro ao gerar documento");
        return;
      }
      toast.success(`${currentCatalogEntry?.label || "Documento"} gerado com sucesso!`);
      setEditingContent(null);
      onProjectUpdate();
    } catch {
      toast.error("Erro de conexão ao gerar documento.");
    } finally {
      setGenerating(false);
    }
  };

  if (!currentCatalogEntry) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Documento não encontrado.</p>
      </div>
    );
  }

  return (
    <Card className="min-h-[600px] border-border bg-card shadow-sm rounded-2xl flex flex-col overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border bg-muted/30 pb-5 pt-6 px-6 gap-4">
        <div>
          <CardTitle className="text-xl font-bold tracking-tight">
            {currentCatalogEntry.label}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {currentCatalogEntry.description}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                getRequirementLevel(currentCatalogEntry) === "REQUIRED"
                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30"
                  : "bg-muted text-muted-foreground ring-1 ring-border"
              }`}
            >
              {getRequirementLevel(currentCatalogEntry) === "REQUIRED" ? (
                <>
                  <Shield className="h-3 w-3" /> Obrigatório
                </>
              ) : (
                <>
                  <Star className="h-3 w-3" /> Desejável
                </>
              )}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                currentArtifact
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30"
                  : "bg-muted text-muted-foreground ring-1 ring-border"
              }`}
            >
              {currentArtifact ? (
                <>
                  <CheckCircle2 className="h-3 w-3" /> Gerado
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" /> Pendente
                </>
              )}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {editingContent !== null ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full px-4"
                onClick={() => setEditingContent(null)}
              >
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="rounded-full px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </>
          ) : (
            <>
              {currentArtifact && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full px-4"
                    onClick={handleEdit}
                  >
                    <Edit3 className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full px-4"
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    {generating ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Regenerar
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 md:p-8 flex-1">
        {editingContent !== null ? (
          <Textarea
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            className="min-h-[450px] font-mono text-sm leading-relaxed p-4 rounded-xl resize-y"
          />
        ) : currentArtifact ? (
          <div className="overflow-x-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:font-bold prose-headings:border-b prose-headings:border-border prose-headings:pb-2 prose-headings:mb-4 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-muted-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-table:w-full prose-table:text-sm prose-table:border-collapse prose-th:bg-muted prose-th:px-4 prose-th:py-2.5 prose-th:text-left prose-th:font-semibold prose-th:border prose-th:border-border prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-border prose-li:text-muted-foreground prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground [&_table]:rounded-lg [&_table]:overflow-hidden [&_thead]:bg-muted">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {(currentArtifact.content as unknown as ArtifactContent)
                  .text || "Conteúdo não disponível."}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-primary/10 p-5 mb-5">
              <FileText className="h-10 w-10 text-primary/60" />
            </div>
            <h3 className="text-lg font-bold mb-2">
              Documento ainda não gerado
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              A IA pode gerar este documento automaticamente com base nos
              dados do seu projeto, seguindo as melhores práticas do PMBoK.
            </p>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 shadow-lg shadow-primary/20"
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Gerando documento...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Gerar com IA
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
