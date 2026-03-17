/**
 * Sanitização de inputs para prompts de IA.
 * Protege contra prompt injection e limita tamanho dos inputs.
 */

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/gi,
  /ignore\s+(all\s+)?above/gi,
  /disregard\s+(all\s+)?previous/gi,
  /you\s+are\s+now/gi,
  /act\s+as\s+(a\s+)?/gi,
  /system\s*:/gi,
  /\bprompt\s*:/gi,
  /\brole\s*:\s*(system|assistant|user)/gi,
  /```\s*(system|prompt)/gi,
  /<\s*(system|prompt|instruction)/gi,
  /novo\s+papel/gi,
  /ignore\s+as\s+instru[çc][õo]es/gi,
  /desconsidere\s+(tudo|as\s+instru)/gi,
];

const DEFAULT_MAX_LENGTH = 2000;
const SHORT_MAX_LENGTH = 500;

/**
 * Sanitiza uma string para uso seguro em prompts de IA.
 * - Remove padrões de prompt injection
 * - Limita tamanho
 * - Normaliza whitespace
 */
export function sanitizeForPrompt(
  input: string | null | undefined,
  maxLength: number = DEFAULT_MAX_LENGTH
): string {
  if (!input) return "";

  let sanitized = String(input);

  // Remove injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[removido]");
  }

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, " ").trim();

  // Truncate
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength) + "...";
  }

  return sanitized;
}

/**
 * Sanitiza campo curto (nome, gerente, etc.)
 */
export function sanitizeShort(input: string | null | undefined): string {
  return sanitizeForPrompt(input, SHORT_MAX_LENGTH);
}

/**
 * Sanitiza todos os campos de um objeto, retornando cópia sanitizada.
 */
export function sanitizeProjectInputs(data: Record<string, unknown>): Record<string, unknown> {
  const shortFields = ["name", "manager", "department", "stakeholders"];
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      result[key] = shortFields.includes(key)
        ? sanitizeShort(value)
        : sanitizeForPrompt(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}
