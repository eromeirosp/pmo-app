import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parseia uma string de data evitando o bug de timezone UTC.
 * "2026-03-12" sem hora é interpretado como UTC meia-noite,
 * que em BRT (UTC-3) vira dia 11. Adicionando T00:00:00
 * força interpretação como horário local.
 */
export function parseLocalDate(dateStr: string | Date): Date {
  if (dateStr instanceof Date) return dateStr;
  // Extrair apenas a parte YYYY-MM-DD de qualquer formato ISO
  const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return new Date(match[1] + "T00:00:00");
  }
  return new Date(dateStr);
}

export function calculateROI(budget: number, expectedReturn: number | null | undefined): number | null {
  if (!expectedReturn || budget <= 0) return null;
  return ((expectedReturn - budget) / budget) * 100;
}
