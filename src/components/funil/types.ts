import type { SituacaoWhats } from "../NumeroWhats";

/**
 * Contrato do funil compartilhado (sistema × representantes).
 *
 * Regras do molde `MailClient`: tudo serializável, IDs string, datas ISO
 * (o sistema converte epoch NA BORDA, no wrapper). O componente não conhece
 * schema de banco nem server action — só estes tipos e os callbacks.
 */

/** Como foi o último contato humano com a conta. */
export type EstadoContatoFunil = "nunca" | "tentou" | "falou" | "respondeu";

/** O que a máquina de e-mails já fez com a conta. */
export type EnvioFunil = {
  estado: "nunca" | "recebeu" | "abriu" | "clicou";
  campanha: string | null;
  em: string | null;
};

/** Ficha que a automação escreveu ao entregar a conta pro humano. */
export type HandoffFunil = {
  motivo?: string | null;
  /** 0–100 — quanto maior, mais quente (ordena "Esperando a vez"). */
  prioridade?: number | null;
  /** O que a máquina sugere fazer agora (1 frase). */
  plano?: string | null;
  /** Evidências ("abriu 3 e-mails", "pediu preço"...). */
  porque?: string[] | null;
  sugestao?: { canal?: string | null; texto?: string | null } | null;
};

/** Uma linha do funil — a conta como a operadora vê. */
export type LinhaFunil = {
  id: string;
  nome: string | null;
  empresa: string | null;
  cidade: string | null;
  email: string | null;
  telefone: string | null;
  /** Origem/fonte cruas — o `LeadKindBadge` classifica sozinho. */
  origem?: string | null;
  source?: string | null;
  segmento?: string | null;
  /** Valor de `EtapaFunilOpcao.value` do vocabulário do app. */
  etapa: string;
  whats: SituacaoWhats;
  contato: { estado: EstadoContatoFunil; em: string | null };
  proximaAcao: string | null;
  /** ISO — passo marcado pra este dia. */
  proximaAcaoEm: string | null;
  /** A máquina de e-mails está cuidando (humano só observa). */
  naMaquina: boolean;
  /** Entregue mas ainda fora da capacidade do dia ("esperando a vez"). */
  naEspera: boolean;
  handoff: HandoffFunil | null;
  envio: EnvioFunil | null;
  /** Pedido de ajuda aberto ao José (rep) — controla Chamar/Retirar. */
  pedidoJose: { abertoEm: string | null; atendidoEm: string | null } | null;
  /** Veredito de `podeVoltarParaMaquina` — calculado NO APP. */
  voltaIa: { pode: boolean; motivo?: string | null } | null;
  criadoEm: string;
  /** Score do lead (só o sistema tem — liga a coluna com `onExplicarScore`). */
  score?: number | null;
  notas: string[];
};

/** Vocabulário de etapas do app (label/cores por painel). */
export type EtapaFunilOpcao = {
  value: string;
  label: string;
  hint?: string;
  bg?: string;
  color?: string;
  /** Etapa que ENCERRA a conta: sai do dia-a-dia (ganho = "Fechei" no KPI). */
  encerra?: "ganho" | "fora";
};

/** Cores/rótulos do "Falei?" — iguais nos dois painéis. */
export const CONTATO_META: Record<EstadoContatoFunil, { label: string; bg: string; color: string }> = {
  nunca: { label: "Nunca falou", bg: "rgba(220,38,38,0.12)", color: "#b91c1c" },
  tentou: { label: "Tentei", bg: "rgba(234,179,8,0.16)", color: "#a16207" },
  falou: { label: "Falei", bg: "rgba(37,99,235,0.12)", color: "#1d4ed8" },
  respondeu: { label: "Respondeu", bg: "rgba(34,197,94,0.14)", color: "#15803d" },
};

/** Sinais de proposta por leadId (alimenta "Por que agora" e a Ficha). */
export type PropostaResumo = { views: number; viewsSite?: number };
/** Orçamento existente por leadId (muda o rótulo da ação). */
export type OrcamentoResumo = { numero?: string | null };

/**
 * Callbacks — TODOS opcionais: callback ausente = a affordance SOME da tela.
 * É assim que o mesmo componente vira a tela do rep (com mover etapa, chamar
 * o José) ou a do sistema (com descartar/desfazer, score) sem `if (painel)`.
 */
export type FunilCallbacks = {
  onMarcarPasso?: (id: string, acao: string, diaISO: string) => Promise<void>;
  onConcluirPasso?: (id: string) => Promise<void>;
  onRegistrarContato?: (
    id: string,
    dados: { falou: boolean; canal: string; motivo?: string; obs?: string },
  ) => Promise<void>;
  onNota?: (id: string, texto: string) => Promise<void>;
  onMoverEtapa?: (id: string, etapa: string) => Promise<void>;
  onDevolverParaAutomacao?: (id: string) => Promise<void>;
  /** Confere números no servidor-whats — o componente fatia em lotes sozinho. */
  onVerificarWhats?: (ids: string[]) => Promise<Record<string, SituacaoWhats>>;
  /** Abre a conversa (wa.me/balão) e registra o contato como o app quiser. */
  onEnviarWhats?: (linha: LinhaFunil, fone: string) => void;
  onAbrirProposta?: (linha: LinhaFunil) => void;
  onAbrirOrcamento?: (linha: LinhaFunil) => void;
  onEmail?: (linha: LinhaFunil) => void;
  onChamarJose?: (id: string, motivo: string) => Promise<void>;
  onRetirarPedido?: (id: string) => Promise<void>;
  onDescartar?: (id: string) => Promise<void>;
  onDesfazer?: (id: string) => Promise<void>;
  onMarcarSemWhats?: (id: string) => Promise<void>;
  /** Liga a coluna Score (sistema). */
  onExplicarScore?: (linha: LinhaFunil) => void;
};
