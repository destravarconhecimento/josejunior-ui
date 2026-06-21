import type { NavSection } from "./types";

// Faixa de marcas diacríticas combinantes (acentos) — removidas após NFD.
const DIACRITICS = /[̀-ͯ]/g;

/** Normaliza p/ busca: minúsculas, sem acento, sem espaço nas pontas. */
function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(DIACRITICS, "").trim();
}

/**
 * Filtra as seções pelo termo (compara contra o `label` de cada item, sem
 * acento/caixa). Seção que ficar sem itens é removida. Termo vazio → original.
 */
export function filterSections(sections: NavSection[], query: string): NavSection[] {
  const q = normalize(query);
  if (!q) return sections;
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => normalize(item.label).includes(q)),
    }))
    .filter((section) => section.items.length > 0);
}
