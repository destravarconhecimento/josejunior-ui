export const FUSO_OPERACAO = "America/Sao_Paulo";

export type FormatoUi = {
  locale: string;
  moeda: string;
  fuso: string;
};

export const FORMATO_PT: FormatoUi = {
  locale: "pt-BR",
  moeda: "BRL",
  fuso: FUSO_OPERACAO,
};

const LOCALE_INTL: Record<string, string> = {
  pt: "pt-BR",
  en: "en-US",
  zh: "zh-CN",
};

export function localeIntl(locale: string): string {
  return LOCALE_INTL[locale] ?? locale;
}

function numeroDe(valor: unknown): number | null {
  if (valor == null || valor === "") return null;
  const n = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(n) ? n : null;
}

function dataDe(valor: unknown): Date | null {
  if (valor == null || valor === "") return null;
  const d = valor instanceof Date ? valor : new Date(valor as string | number);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatarMoeda(
  valor: unknown,
  formato: FormatoUi = FORMATO_PT,
  semValor = "—",
): string {
  const n = numeroDe(valor);
  if (n == null) return semValor;
  try {
    return new Intl.NumberFormat(localeIntl(formato.locale), {
      style: "currency",
      currency: formato.moeda,
    }).format(n);
  } catch {
    return `${formato.moeda} ${n.toFixed(2)}`;
  }
}

export function formatarNumero(
  valor: unknown,
  formato: FormatoUi = FORMATO_PT,
  casas?: number,
  semValor = "—",
): string {
  const n = numeroDe(valor);
  if (n == null) return semValor;
  try {
    return new Intl.NumberFormat(localeIntl(formato.locale), {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    }).format(n);
  } catch {
    return casas == null ? String(n) : n.toFixed(casas);
  }
}

export function formatarPercentual(
  valor: unknown,
  formato: FormatoUi = FORMATO_PT,
  casas = 2,
  semValor = "—",
): string {
  const n = numeroDe(valor);
  if (n == null) return semValor;
  try {
    return new Intl.NumberFormat(localeIntl(formato.locale), {
      style: "percent",
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    }).format(n / 100);
  } catch {
    return `${n.toFixed(casas)}%`;
  }
}

export function formatarData(
  valor: unknown,
  formato: FormatoUi = FORMATO_PT,
  semValor = "—",
): string {
  const d = dataDe(valor);
  if (!d) return semValor;
  try {
    return new Intl.DateTimeFormat(localeIntl(formato.locale), {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: formato.fuso,
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export function formatarDataHora(
  valor: unknown,
  formato: FormatoUi = FORMATO_PT,
  semValor = "—",
): string {
  const d = dataDe(valor);
  if (!d) return semValor;
  try {
    return new Intl.DateTimeFormat(localeIntl(formato.locale), {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: formato.fuso,
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 16).replace("T", " ");
  }
}
