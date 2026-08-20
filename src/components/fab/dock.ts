"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";

/**
 * Dock dos FABs flutuantes do painel.
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

export const FAB_SIZE = 34; // px — diâmetro do botão
export const FAB_BASE = 8; // px — folga do botão até o canto (bottom/lateral)
const FAB_GAP = 10; // px — respiro entre botões empilhados

/* ============================================================
 * ONDE o dock fica — e por que ele se move
 *
 * O canto é o inferior-DIREITO, que é onde o painel sempre teve os botões
 * flutuantes. Já esteve na esquerda por uma rodada — lá ele tapava a primeira
 * coluna da tabela e o José pediu de volta pra direita.
 *
 * O motivo de ele ter fugido da direita continua valendo: ali ficam a coluna
 * congelada de AÇÕES do funil, a paginação e o rodapé da tabela. A resposta
 * agora não é mudar de lado, é OCUPAR MENOS: 34px de diâmetro (era 56, depois
 * 42) e 8px de folga do canto, encostado o quanto dá. Assim a pilha cabe na
 * quina, abaixo da última linha de ações, em vez de pousar em cima dela.
 *
 * E continua ARRASTÁVEL: o arrasto é de um dock SÓ (os dois botões andam
 * juntos) — foi por posição individual que eles colidiram da primeira vez;
 * aqui a pilha continua sendo uma pilha.
 *
 * Ao soltar, o dock ENCOSTA no lado mais próximo (esquerda/direita) e guarda
 * só isso mais a altura: assim ele nunca fica no meio da tabela, e a janela
 * mudar de tamanho não deixa o botão fora da tela. A escolha é da pessoa e
 * fica no `localStorage`.
 * ============================================================ */

export type FabLado = "esq" | "dir";
export type FabPos = { lado: FabLado; bottom: number };

// `:v2` — a chave foi versionada de propósito ao dock voltar pra DIREITA: quem
// já tinha arrastado (ou só guardado o padrão antigo, "esq") ficaria preso na
// esquerda e nunca veria a mudança. Trocar a chave é o reset de uma vez só;
// quem arrastar de novo grava na nova e a preferência volta a mandar.
const POS_KEY = "jj:fab-pos:v2";
const POS_PADRAO: FabPos = { lado: "dir", bottom: FAB_BASE };

/** Quanto o dock inteiro ocupa em altura (px) — usado pra prender o arrasto. */
const alturaDaPilha = (n: number) => n * FAB_SIZE + Math.max(0, n - 1) * FAB_GAP;

const prender = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

/**
 * Como o painel aberto se apresenta:
 *   • `flutuante` — a janelinha de sempre, no canto (some ao fechar);
 *   • `lateral`   — encostado na direita, ocupando a altura inteira da janela.
 *
 * É PREFERÊNCIA da pessoa, não estado da sessão: fica no `localStorage` por FAB
 * (quem trabalha o dia todo no WhatsApp deixa lateral; quem só espia, flutuante).
 */
export type FabModo = "flutuante" | "lateral";

const MODO_KEY = "jj:fab-modo";

/** Largura do painel encostado (px) — a mesma nos dois FABs. */
export const FAB_LATERAL_W = 420;

/**
 * Variáveis que o painel ACOPLADO publica no `<html>`:
 *   • `--jj-fab-dock-w` — a largura crua (420px), enquanto houver painel encostado;
 *   • `data-fab-dock="1"` — o interruptor.
 *
 * Quem transforma isso em espaço reservado é o CSS estrutural (`--jj-fab-dock`),
 * e só a partir de `lg`: abaixo disso a janela é estreita demais pra doar 420px
 * — lá o painel segue POR CIMA, como sempre foi. O shell (e a tabela em tela
 * cheia) só lê `var(--jj-fab-dock, 0px)`; sem o CSS carregado o valor é 0 e o
 * comportamento antigo continua valendo.
 */
const DOCK_ATTR = "data-fab-dock";
const DOCK_W_VAR = "--jj-fab-dock-w";

export function useFabModo(id: FabId): [FabModo, (m: FabModo) => void] {
  // Começa SEMPRE flutuante e lê a preferência no efeito: ler o localStorage no
  // primeiro render faria o HTML do servidor divergir do cliente (hidratação).
  const [modo, setModoState] = useState<FabModo>("flutuante");

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(`${MODO_KEY}:${id}`);
      if (v === "lateral" || v === "flutuante") setModoState(v);
    } catch {
      /* localStorage bloqueado (modo anónimo/iframe): fica no padrão */
    }
  }, [id]);

  const setModo = useCallback(
    (m: FabModo) => {
      setModoState(m);
      try {
        window.localStorage.setItem(`${MODO_KEY}:${id}`, m);
      } catch {
        /* idem — a escolha vale pra esta sessão */
      }
    },
    [id],
  );

  return [modo, setModo];
}

type State = {
  mounted: readonly FabId[];
  openId: FabId | null;
  suppress: number;
  acoplado: FabId | null;
  /** Onde o dock está. `null` = ainda não li o localStorage (ver `useFabPos`). */
  pos: FabPos | null;
};
let state: State = { mounted: [], openId: null, suppress: 0, acoplado: null, pos: null };
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
    ...state,
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
 * Onde o dock está agora. Enquanto o `localStorage` não foi lido devolve o
 * PADRÃO — ler no primeiro render faria o HTML do servidor divergir do cliente
 * (a mesma razão do `useFabModo` logo acima).
 */
export function useFabPos(): [FabPos, (p: FabPos) => void] {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (state.pos) return;
    let lido: FabPos | null = null;
    try {
      const cru = window.localStorage.getItem(POS_KEY);
      if (cru) {
        const o = JSON.parse(cru) as Partial<FabPos>;
        if (o && (o.lado === "esq" || o.lado === "dir") && Number.isFinite(o.bottom)) {
          lido = { lado: o.lado, bottom: Number(o.bottom) };
        }
      }
    } catch {
      /* localStorage bloqueado ou JSON estragado: fica no padrão */
    }
    state = { ...state, pos: lido ?? POS_PADRAO };
    emit();
  }, []);

  const setPos = useCallback((p: FabPos) => {
    state = { ...state, pos: p };
    emit();
    try {
      window.localStorage.setItem(POS_KEY, JSON.stringify(p));
    } catch {
      /* idem — a escolha vale pra esta sessão */
    }
  }, []);

  return [snap.pos ?? POS_PADRAO, setPos];
}

function setAcoplado(id: FabId, on: boolean) {
  const next = on ? id : state.acoplado === id ? null : state.acoplado;
  if (next === state.acoplado) return;
  state = { ...state, acoplado: next };
  // Escreve no <html> em vez de no React: o espaço é reservado por CSS, então
  // atravessa navegação, shell e Portal sem ninguém precisar re-renderizar.
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (next) {
      root.style.setProperty(DOCK_W_VAR, `${FAB_LATERAL_W}px`);
      root.setAttribute(DOCK_ATTR, "1");
    } else {
      root.removeAttribute(DOCK_ATTR);
      root.style.removeProperty(DOCK_W_VAR);
    }
  }
  emit();
}

/**
 * ACOPLA o painel: enquanto `on`, a página encolhe pela direita em vez de ficar
 * TAPADA pelo painel encostado (é o "vira docker e empurra o site pra esquerda").
 * `on` tem de espelhar o que está REALMENTE na tela — painel aberto, em modo
 * lateral e não escondido pela rota —, senão o painel some e a página fica com
 * um vão de 420px. Solta sozinho ao desmontar (troca de tela, logout).
 */
export function useFabAcoplado(id: FabId, on: boolean) {
  useEffect(() => {
    setAcoplado(id, on);
    return () => setAcoplado(id, false);
  }, [id, on]);
}

/** Há painel encostado agora? (pra quem precisa reagir em JS, não em CSS.) */
export function useFabAcopladoAtivo() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot).acoplado != null;
}

/**
 * SILENCIA todos os FABs enquanto uma TELA abre o chat dela na lateral direita
 * (ex.: a IA da caixa de e-mail). Sem isto, o painel da tela e o balão do
 * assistente disputariam o mesmo canto — dois chats abertos, um por cima do
 * outro. Contador (e não booleano) porque duas telas podem montar no mesmo
 * instante durante uma navegação.
 */
export function useFabSuppress(active: boolean) {
  useEffect(() => {
    if (!active) return;
    state = { ...state, suppress: state.suppress + 1, openId: null };
    emit();
    return () => {
      state = { ...state, suppress: Math.max(0, state.suppress - 1) };
      emit();
    };
  }, [active]);
}

/**
 * Liga um FAB ao dock. `present` = este FAB quer aparecer (ignorando o irmão).
 * Devolve onde o botão fica, o lado em que o dock está encostado (o painel abre
 * pro mesmo lado), o que é preciso pra ARRASTAR e se OUTRO painel está aberto —
 * nesse caso o chamador deve sumir (`return null`).
 */
export function useFabDock(id: FabId, present: boolean) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [pos, setPos] = useFabPos();

  useEffect(() => {
    setMounted(id, present);
    return () => setMounted(id, false);
  }, [id, present]);

  // Conta só os presentes; inclui a si mesmo pra não saltar de posição no
  // primeiro render (antes de o efeito de registo correr).
  const visiveis = ORDER.filter((x) => (x === id ? present : snap.mounted.includes(x)));
  const slot = Math.max(0, visiveis.indexOf(id));
  const bottom = pos.bottom + slot * (FAB_SIZE + FAB_GAP);

  // Arrasto: enquanto a mão está em cima o botão segue o dedo (`vivo`), e só ao
  // soltar é que a posição vira preferência guardada. `moveu` distingue arrasto
  // de CLIQUE — sem isso, todo arrasto terminaria abrindo o painel.
  const [vivo, setVivo] = useState<{ x: number; y: number } | null>(null);
  const arrasto = useRef<{ x0: number; y0: number; moveu: boolean } | null>(null);
  const moveuRef = useRef(false);

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    arrasto.current = { x0: e.clientX, y0: e.clientY, moveu: false };
    moveuRef.current = false;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    const a = arrasto.current;
    if (!a) return;
    // Limiar de 5px: mão trémula em cima do botão continua sendo clique.
    if (!a.moveu && Math.hypot(e.clientX - a.x0, e.clientY - a.y0) < 5) return;
    a.moveu = true;
    moveuRef.current = true;
    setVivo({ x: e.clientX, y: e.clientY });
  }, []);

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const a = arrasto.current;
      arrasto.current = null;
      setVivo(null);
      if (!a?.moveu) return;
      // Encosta no lado mais próximo e prende a altura DENTRO da janela — assim
      // o dock nunca fica no meio da tabela nem some ao redimensionar.
      const lado: FabLado = e.clientX < window.innerWidth / 2 ? "esq" : "dir";
      const pilha = alturaDaPilha(visiveis.length);
      const desteBotao = window.innerHeight - e.clientY - FAB_SIZE / 2;
      const base = desteBotao - slot * (FAB_SIZE + FAB_GAP);
      setPos({ lado, bottom: Math.round(prender(base, FAB_BASE, window.innerHeight - pilha - FAB_BASE)) });
    },
    [setPos, slot, visiveis.length],
  );

  return {
    /** `bottom` (px) do BOTÃO quando o painel deste FAB está fechado. */
    bottom,
    /** Em que lado o dock está encostado — o painel flutuante abre pro mesmo. */
    lado: pos.lado,
    selfOpen: snap.openId === id,
    // Uma tela com chat próprio aberto (useFabSuppress) conta como "outro aberto":
    // o FAB some pelo caminho que já existia, sem tocar em quem o usa.
    othersOpen: snap.suppress > 0 || (snap.openId != null && snap.openId !== id),
    /**
     * O que o botão precisa pra ser arrastável. Espalhar no elemento e chamar
     * `arrastou()` no `onClick` — se devolver `true`, o clique é o fim de um
     * arrasto e não deve abrir nada.
     */
    arrastoProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      style: {
        touchAction: "none" as const,
        cursor: vivo ? ("grabbing" as const) : ("grab" as const),
        ...(vivo
          ? { left: `${vivo.x - FAB_SIZE / 2}px`, top: `${vivo.y - FAB_SIZE / 2}px`, right: "auto", bottom: "auto" }
          : null),
      },
    },
    /** Está sendo arrastado AGORA (o botão segue o dedo, sem transição). */
    arrastando: vivo != null,
    arrastou: () => moveuRef.current,
  };
}
