/**
 * Evoluções — tipos e regras PURAS (sem React, sem Chakra, sem "use client").
 * Server (repo, raster da arte) e client (tela de gestão, editor de flyer)
 * importam daqui para não divergirem na legenda nem no teto de fotos.
 */

import { normalizeFoco, type FocoFoto } from "./alinhamento";

/**
 * Uma foto da evolução. `caption` null/vazia = usa a legenda padrão da posição.
 * `foco` é onde a pessoa está na foto (medido pela IA, ver `alinhamento.ts`);
 * ausente = a faixa renderiza a foto inteira, como sempre fez.
 */
export type EvolucaoFoto = { url: string; caption: string | null; foco?: FocoFoto | null };

/** Teto de fotos por evolução (o antes/durante/depois virou uma lista). */
export const MAX_EVOLUCAO_FOTOS = 5;

/**
 * Legenda PADRÃO da posição — é o placeholder no editor e o rótulo exibido
 * quando o usuário não escreve nada. A escada preserva o comportamento antigo:
 * a 1ª é "Antes", a última é "Depois" e o miolo é "Durante" (numerado quando há
 * mais de um). Com 1 foto só, não há antes/depois: fica "Resultado".
 */
export function legendaPadraoEvolucao(index: number, total: number): string {
  if (total <= 1) return "Resultado";
  if (index === 0) return "Antes";
  if (index === total - 1) return "Depois";
  return total > 3 ? `Durante ${index}` : "Durante";
}

/** Legenda para exibir: a escrita pelo usuário ou, vazia, a padrão da posição. */
export function legendaDaFoto(foto: EvolucaoFoto, index: number, total: number): string {
  const escrita = (foto.caption ?? "").trim();
  return escrita || legendaPadraoEvolucao(index, total);
}

/** Saneia o que veio do banco/formulário: só itens com URL, no máximo 5. */
export function normalizeEvolucaoFotos(value: unknown): EvolucaoFoto[] {
  if (!Array.isArray(value)) return [];
  const out: EvolucaoFoto[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as { url?: unknown; caption?: unknown };
    const url = typeof item.url === "string" ? item.url.trim() : "";
    if (!url) continue;
    const caption = typeof item.caption === "string" ? item.caption.trim().slice(0, 60) : "";
    const foco = normalizeFoco((item as { foco?: unknown }).foco);
    out.push(foco ? { url, caption: caption || null, foco } : { url, caption: caption || null });
    if (out.length >= MAX_EVOLUCAO_FOTOS) break;
  }
  return out;
}

/**
 * Distribuição das fotos em linhas para a arte/preview — o que evita o card
 * "zoado" quando a quantidade muda: 4 vira 2+2 e 5 vira 3+2, nunca uma fileira
 * de 5 fotos espremidas.
 */
export function linhasDaEvolucao(total: number): number[] {
  if (total <= 3) return [Math.max(total, 1)];
  if (total === 4) return [2, 2];
  return [3, 2];
}
