// Presets de tabela ("Minhas listas"): nome + filtros + ordenação, guardados
// no localStorage do navegador — preferência da PESSOA, não dado do sistema
// (molde: components/fab/dock.ts). Sem UI aqui: quem desenha o menu é a tela
// (ex.: o "Minhas listas" do FunilLeadsTable).
//
// Leia SEMPRE dentro de evento/efeito (nunca no primeiro render): ler
// localStorage durante a hidratação faz o HTML do servidor divergir do cliente.

import type { FiltroColuna } from "./filtros";
import type { SortState } from "./sort";

export type PresetTabela = {
  nome: string;
  filtros: FiltroColuna[];
  sort: SortState | null;
};

const chave = (tableId: string) => `jj:tabela:${tableId}:presets:v1`;

export function lerPresets(tableId: string): PresetTabela[] {
  try {
    const cru = window.localStorage.getItem(chave(tableId));
    if (!cru) return [];
    const lista = JSON.parse(cru) as unknown;
    if (!Array.isArray(lista)) return [];
    return lista.filter(
      (p): p is PresetTabela =>
        !!p &&
        typeof (p as PresetTabela).nome === "string" &&
        Array.isArray((p as PresetTabela).filtros),
    );
  } catch {
    return []; // localStorage bloqueado ou JSON estragado: sem presets salvos
  }
}

export function gravarPresets(tableId: string, presets: PresetTabela[]): void {
  try {
    window.localStorage.setItem(chave(tableId), JSON.stringify(presets));
  } catch {
    // bloqueado (anônimo/iframe): a lista vale só pra esta sessão
  }
}
