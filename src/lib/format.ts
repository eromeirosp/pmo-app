const CURRENCY_CONFIG: Record<string, { locale: string; currency: string }> = {
  BRL: { locale: "pt-BR", currency: "BRL" },
  USD: { locale: "en-US", currency: "USD" },
  EUR: { locale: "de-DE", currency: "EUR" },
};

export function formatCurrency(value: number, currencyCode = "BRL"): string {
  const config = CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG.BRL;
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
  }).format(value);
}

export function formatCurrencyCompact(value: number, currencyCode = "BRL"): string {
  const config = CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG.BRL;
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function getCurrencySymbol(currencyCode = "BRL"): string {
  return currencyCode === "BRL" ? "R$" : currencyCode === "USD" ? "US$" : "€";
}

// ── Multi-Currency Conversion ────────────────────────────

/**
 * Exchange rates relative to BRL (1 unit of foreign currency = X BRL).
 * Hardcoded for now — zero API cost.
 * Update periodically or replace with live API when budget allows.
 */
const EXCHANGE_RATES_TO_BRL: Record<string, number> = {
  BRL: 1,
  USD: 5.65,
  EUR: 6.10,
};

/**
 * Convert a monetary value between currencies.
 * Converts via BRL as the intermediary.
 */
export function convertCurrency(value: number, from: string, to: string): number {
  if (from === to) return value;
  const fromRate = EXCHANGE_RATES_TO_BRL[from] ?? 1;
  const toRate = EXCHANGE_RATES_TO_BRL[to] ?? 1;
  return (value * fromRate) / toRate;
}

/**
 * Convert and format: shows value in target currency.
 */
export function formatCurrencyConverted(value: number, from: string, to: string): string {
  return formatCurrency(convertCurrency(value, from, to), to);
}

/**
 * Get all supported currency codes.
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(EXCHANGE_RATES_TO_BRL);
}

/**
 * Get the exchange rate label for display.
 */
export function getExchangeRateLabel(from: string, to: string): string {
  if (from === to) return "1:1";
  const fromRate = EXCHANGE_RATES_TO_BRL[from] ?? 1;
  const toRate = EXCHANGE_RATES_TO_BRL[to] ?? 1;
  const rate = fromRate / toRate;
  return `1 ${from} = ${rate.toFixed(2)} ${to}`;
}
