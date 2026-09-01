import type { KpiTone } from "../KpiCard";
import type { EtapaFunilOpcao, LinhaFunil, PropostaResumo } from "./types";

/**
 * Motor puro do "seu dia": blocos, sinal "por que agora" e a Ordem do dia.
 * Zero React aqui — tudo testável de cabeça e compartilhado pelos dois painéis.
 */

/** `aaaa-mm-dd` LOCAL (nunca `toISOString`, que vira UTC e erra o dia à noite). */
export function diaLocal(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Fim de hoje em ms — o corte entre "Pra hoje" (inclui atrasado) e "Agendado". */
export function fimDeHoje(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/** `dd/mm` — datas de passo (curtas, cabem na célula). */
export function fmtDia(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/** `dd/mm hh:mm` — datas de contato/aviso. */
export function fmtData(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

/** Blocos da faixa do dia (KpiRow) — cada um é um filtro combinável. */
export type BlocoDia = "hoje" | "sem_passo" | "sem_contato" | "agendado" | "espera" | "fechados";

export const BLOCO_META: Record<BlocoDia, { label: string; tone: KpiTone }> = {
  hoje: { label: "Pra hoje", tone: "primary" },
  sem_passo: { label: "Sem próximo passo", tone: "danger" },
  sem_contato: { label: "Ninguém falou", tone: "danger" },
  agendado: { label: "Agendado", tone: "neutral" },
  espera: { label: "Esperando a vez", tone: "accent" },
  fechados: { label: "Fechei", tone: "success" },
};

export const BLOCOS_DIA: BlocoDia[] = ["hoje", "sem_passo", "sem_contato", "agendado", "espera", "fechados"];

export function encerraDe(etapa: string, etapas: EtapaFunilOpcao[]): "ganho" | "fora" | null {
  return etapas.find((e) => e.value === etapa)?.encerra ?? null;
}

/**
 * A conta está neste bloco? (mesma semântica da tela antiga do rep)
 * Blocos NÃO são exclusivos: "sem_contato" e "sem_passo" se sobrepõem de
 * propósito — são duas dores diferentes da mesma conta.
 */
export function noBloco(l: LinhaFunil, bloco: BlocoDia, limite: number, etapas: EtapaFunilOpcao[]): boolean {
  const fim = encerraDe(l.etapa, etapas);
  if (bloco === "fechados") return fim === "ganho";
  if (fim) return false;
  switch (bloco) {
    case "espera":
      return l.naEspera;
    case "sem_contato":
      return !l.naEspera && l.contato.estado === "nunca";
    case "sem_passo":
      return !l.naEspera && !l.proximaAcaoEm;
    case "hoje": {
      if (l.naEspera || !l.proximaAcaoEm) return false;
      return new Date(l.proximaAcaoEm).getTime() <= limite;
    }
    case "agendado": {
      if (l.naEspera || !l.proximaAcaoEm) return false;
      return new Date(l.proximaAcaoEm).getTime() > limite;
    }
  }
}

/** O sinal mais forte da conta — a coluna "Por que agora" (UM selo por linha). */
export type SinalFunil = {
  /** Rótulo ESTÁVEL (sem contagem) — é o `value` da coluna: faceta e sort funcionam. */
  rotulo: "Respondeu" | "Abriu a proposta" | "Clicou no e-mail" | "Quente" | "Oportunidade" | "Parado";
  bg: string;
  color: string;
  /** Reforço na Ordem do dia (maior = mais em cima dentro do bloco). */
  forca: number;
  /** Complemento volátil do render ("3×", "há 12 dias") — NUNCA no value. */
  detalhe?: string;
};

export function sinalDe(l: LinhaFunil, proposta?: PropostaResumo): SinalFunil {
  if (l.contato.estado === "respondeu")
    return { rotulo: "Respondeu", bg: "rgba(34,197,94,0.14)", color: "#15803d", forca: 5 };
  const views = (proposta?.views ?? 0) + (proposta?.viewsSite ?? 0);
  if (views > 0)
    return {
      rotulo: "Abriu a proposta",
      bg: "rgba(37,99,235,0.12)",
      color: "#1d4ed8",
      forca: 4,
      detalhe: views > 1 ? `${views}×` : undefined,
    };
  if (l.envio?.estado === "clicou")
    return { rotulo: "Clicou no e-mail", bg: "rgba(37,99,235,0.12)", color: "#1d4ed8", forca: 3 };
  if ((l.handoff?.prioridade ?? 0) >= 70)
    return { rotulo: "Quente", bg: "rgba(249,115,22,0.16)", color: "#c2410c", forca: 2 };
  if (l.handoff)
    return { rotulo: "Oportunidade", bg: "rgba(234,179,8,0.18)", color: "#a16207", forca: 1 };
  const desde = l.contato.em ?? l.criadoEm;
  const dias = Math.max(0, Math.floor((Date.now() - new Date(desde).getTime()) / 86_400_000));
  return {
    rotulo: "Parado",
    bg: "rgba(100,116,139,0.12)",
    color: "#64748b",
    forca: 0,
    detalhe: dias > 0 ? `há ${dias} dia${dias === 1 ? "" : "s"}` : undefined,
  };
}

/**
 * "Ordem do dia" — a ordem padrão da tela (o SQL deixa de mandar): o trabalho
 * de hoje primeiro, o vermelho em seguida, o futuro depois, encerrado no fim.
 * 0 pra hoje/atrasado (data asc) → 1 sem passo (sinal desc) → 2 agendado
 * (data asc) → 3 esperando a vez (prioridade desc) → 4 resto vivo (mais novo
 * primeiro) → 5 encerrado.
 */
export function ordemDoDia(
  lista: LinhaFunil[],
  etapas: EtapaFunilOpcao[],
  propostas?: Record<string, PropostaResumo | undefined>,
): LinhaFunil[] {
  const limite = fimDeHoje();
  const t = (iso: string | null) => (iso ? new Date(iso).getTime() : 0);
  const pesoDe = (l: LinhaFunil): number => {
    if (encerraDe(l.etapa, etapas)) return 5;
    if (noBloco(l, "hoje", limite, etapas)) return 0;
    if (noBloco(l, "sem_passo", limite, etapas)) return 1;
    if (noBloco(l, "agendado", limite, etapas)) return 2;
    if (noBloco(l, "espera", limite, etapas)) return 3;
    return 4;
  };
  const pesos = new Map<string, number>();
  for (const l of lista) pesos.set(l.id, pesoDe(l));
  return [...lista].sort((a, b) => {
    const pa = pesos.get(a.id)!;
    const pb = pesos.get(b.id)!;
    if (pa !== pb) return pa - pb;
    switch (pa) {
      case 0:
      case 2:
        return t(a.proximaAcaoEm) - t(b.proximaAcaoEm);
      case 1:
        return sinalDe(b, propostas?.[b.id]).forca - sinalDe(a, propostas?.[a.id]).forca;
      case 3:
        return (b.handoff?.prioridade ?? 0) - (a.handoff?.prioridade ?? 0);
      default:
        return t(b.criadoEm) - t(a.criadoEm);
    }
  });
}
