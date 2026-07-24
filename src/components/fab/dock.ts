"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Dock dos FABs flutuantes do painel (canto inferior-direito).
 *
 * Dois botões moram aqui — o WhatsApp e o Assistente (IA). Antes cada um se
 * posicionava sozinho (um em `right:6`, o outro em `right:88px`) e os dois
 * PAINÉIS abriam no MESMO canto: abrir um tapava o botão do outro e as janelas
 * se sobrepunham. Além disso cada um era arrastável com posição própria no
 * localStorage, o que só piorava a colisão.
 *
 * Este store minúsculo (client-only; partilhado porque o `@josejunior/ui` é um
 * módulo único por app) resolve isso de forma profissional:
 *   • os botões ficam EMPILHADOS e alinhados na mesma coluna (WhatsApp em baixo,
 *     IA logo acima) — "alinhados encima";
 *   • só um painel abre de cada vez;
 *   • enquanto um painel está aberto, o botão irmão SOME — nada se sobrepõe
 *     ("abriu um não atrapalha o outro").
 *
 * A "gaveta" (slot) de cada FAB reordena sozinha quando um deles não aparece
 * (ex.: WhatsApp desconectado, ou FAB escondido pela rota): o que sobra assume
 * o canto.
 */

// Ordem do dock, de baixo (canto) pra cima. O índice é a "gaveta".
const ORDER = ["whatsapp", "ai"] as const;
export type FabId = (typeof ORDER)[number];

export const FAB_SIZE = 56; // px — diâmetro do botão
export const FAB_BASE = 24; // px — folga do botão até o canto (bottom/right)
const FAB_GAP = 12; // px — respiro entre botões empilhados

/** `bottom` (px) do PAINEL aberto: sempre logo acima do botão do canto. */
export const FAB_PANEL_BOTTOM = FAB_BASE + FAB_SIZE + FAB_GAP; // 92

type State = { mounted: readonly FabId[]; openId: FabId | null };
let state: State = { mounted: [], openId: null };
const subs = new Set<() => void>();

function emit() {
  for (const s of subs) s();
}
function subscribe(cb: () => void) {
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
}
function getSnapshot() {
  return state;
}

function setMounted(id: FabId, present: boolean) {
  const has = state.mounted.includes(id);
  if (present === has) return;
  state = {
    mounted: present ? [...state.mounted, id] : state.mounted.filter((x) => x !== id),
    // Se o FAB aberto sumiu, ninguém fica "aberto".
    openId: !present && state.openId === id ? null : state.openId,
  };
  emit();
}

/** Marca este FAB como aberto (fecha os outros por consequência) ou fechado. */
export function setFabOpen(id: FabId, open: boolean) {
  const next = open ? id : state.openId === id ? null : state.openId;
  if (next === state.openId) return;
  state = { ...state, openId: next };
  emit();
}

/**
 * Liga um FAB ao dock. `present` = este FAB quer aparecer (ignorando o irmão).
 * Devolve a posição empilhada do botão e se OUTRO painel está aberto — nesse
 * caso o chamador deve sumir (`return null`).
 */
export function useFabDock(id: FabId, present: boolean) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    setMounted(id, present);
    return () => setMounted(id, false);
  }, [id, present]);

  // Conta só os presentes; inclui a si mesmo pra não saltar de posição no
  // primeiro render (antes de o efeito de registo correr).
  const visiveis = ORDER.filter((x) => (x === id ? present : snap.mounted.includes(x)));
  const slot = Math.max(0, visiveis.indexOf(id));

  return {
    /** `bottom` (px) do BOTÃO quando o painel deste FAB está fechado. */
    bottom: FAB_BASE + slot * (FAB_SIZE + FAB_GAP),
    selfOpen: snap.openId === id,
    othersOpen: snap.openId != null && snap.openId !== id,
  };
}
