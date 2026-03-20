import { z } from "zod";

/**
 * Schemas Zod para validação de respostas da IA (Gemini).
 * Cada schema corresponde a um tipo de resposta esperada.
 */

// --- Cadência / Rituais ---

export const RitualSchema = z.object({
  name: z.string().min(1),
  recommended: z.boolean(),
  frequency: z.string().min(1),
  justification: z.string().min(1),
});

export const CadenceSchema = z.object({
  rituals: z.array(RitualSchema).min(1),
  governanceSummary: z.string().min(1),
});

// --- Criação de Projeto (/api/ai) ---

export const ProjectCreationSchema = z.object({
  classification: z.enum(["TRADITIONAL", "AGILE", "HYBRID"]),
  businessCase: z.string().min(1),
  preliminaryScope: z.string().min(1),
  preliminaryTimeline: z.string().min(1),
  milestones: z.array(z.string()).min(1),
  successCriteria: z.array(z.string()).min(1),
  expectedReturn: z.number().min(0).default(0),
  cadence: CadenceSchema,
  initialRisks: z.array(
    z.object({
      description: z.string().min(1),
      probability: z.number().min(1).max(5),
      impact: z.number().min(1).max(5),
      category: z.string().min(1),
      mitigation: z.string().optional().default(""),
    })
  ),
});

// --- Sugestões (/api/ai/suggest) ---

export const CharterSuggestionsSchema = z.object({
  suggestions: z.array(z.string()).min(1),
});

export const RiskSuggestionsSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      probability: z.number().min(1).max(5),
      impact: z.number().min(1).max(5),
      category: z.string().min(1),
      mitigation: z.string().optional().default(""),
      contingency: z.string().optional().default(""),
    })
  ),
});

export const StatusReportSuggestSchema = z.object({
  accomplishments: z.string().min(1),
  nextSteps: z.string().min(1),
  issues: z.string().min(1),
});

export const ClassificationSuggestSchema = z.object({
  classification: z.enum(["TRADITIONAL", "AGILE", "HYBRID"]),
  justification: z.string().min(1),
});

// --- EAP Suggest (novo) ---

const EapChildSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
});

export const EapSuggestionsSchema = z.object({
  suggestions: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().optional().default(""),
      children: z.array(EapChildSchema).optional().default([]),
    })
  ),
});

// --- Closing Suggest (novo) ---

export const ClosingSuggestionsSchema = z.object({
  summary: z.string().min(1),
  deliverables: z.array(
    z.object({
      text: z.string().min(1),
      status: z.string().optional().default("concluído"),
    })
  ),
  lessons: z.array(z.string()).min(1),
  recommendations: z.array(z.string()).min(1),
});

// --- Mapa de schemas por tipo de sugestão ---

export const SUGGEST_SCHEMAS: Record<string, z.ZodType> = {
  charter_criteria: CharterSuggestionsSchema,
  charter_deliverables: CharterSuggestionsSchema,
  charter_premises: CharterSuggestionsSchema,
  charter_restrictions: CharterSuggestionsSchema,
  risk_suggest: RiskSuggestionsSchema,
  status_report: StatusReportSuggestSchema,
  classification: ClassificationSuggestSchema,
  eap_suggest: EapSuggestionsSchema,
  closing_suggest: ClosingSuggestionsSchema,
  cadence_suggest: CadenceSchema,
};
