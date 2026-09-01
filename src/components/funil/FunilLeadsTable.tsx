"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  Check,
  Download,
  FileText,
  Headset,
  Hourglass,
  Inbox,
  ListChecks,
  Mail,
  MessageCircle,
  PhoneCall,
  PhoneOff,
  Receipt,
  StickyNote,
  Trash2,
} from "lucide-react";
import { DataTable, type Column } from "../DataTable";
import { AcoesLinha, type AcaoLinha } from "../table/AcoesLinha";
import { ChipFiltro } from "../table/BarraTabela";
import { aplicarFiltros, type FiltroColuna } from "../table/filtros";
import { ordenarLinhas, type SortState } from "../table/sort";
import { gravarPresets, lerPresets, type PresetTabela } from "../table/presets";
import { FilterBar, type SelectFilter } from "../FilterBar";
import { Button } from "../Button";
import { Tag } from "../Badge";
import { AcaoIcone } from "../AcaoIcone";
import { NumeroWhats, type SituacaoWhats } from "../NumeroWhats";
import { LeadKindBadge } from "../LeadKind";
import { FichaLead, type FichaLeadDados } from "../FichaLead";
import { KpiRow, type KpiRowItem } from "../KpiCard";
import { InlineSelect } from "../InlineSelect";
import { ActionMenu, type ActionMenuItem } from "../ActionMenu";
import { Modal } from "../Modal";
import { FormInput } from "../form";
import { toast } from "../Toast";
import { useConfirm } from "../useConfirm";
import { rowMatchesQuery } from "../../search";
import { ChamarJoseModal, ContatoModal, NotaModal, PassoModal } from "./modais";
import {
  CONTATO_META,
  type EtapaFunilOpcao,
  type FunilCallbacks,
  type LinhaFunil,
  type OrcamentoResumo,
  type PropostaResumo,
} from "./types";
import {
  BLOCOS_DIA,
  BLOCO_META,
  diaLocal,
  encerraDe,
  fimDeHoje,
  fmtData,
  fmtDia,
  noBloco,
  ordemDoDia,
  sinalDe,
  type BlocoDia,
} from "./blocos";

/**
 * A tela de funil — UMA só pros dois painéis (sistema × representantes), no
 * molde `MailClient`: dados e callbacks por props, zero conhecimento de banco.
 *
 * Mecânica que mora AQUI (e não nos wrappers): busca (com dígitos = telefone),
 * faixa do dia (KpiRow que filtra), filtros sintéticos convivendo com os de
 * coluna num estado só (presets capturam tudo), "Minhas listas" (fixas +
 * salvas por tableId), Ordem do dia, verificação de WhatsApp em lotes,
 * remendos otimistas, seleção em massa, CSV do que está na tela, Ficha e os
 * 4 modais de trabalho. Callback ausente = a affordance SOME.
 */

const LOTE_WHATS = 50;
const PAUSA_WHATS_MS = 1500;

const PRESETS_FIXOS: PresetTabela[] = [
  { nome: "Meu dia", filtros: [], sort: null },
  {
    nome: "Fila de envio",
    filtros: [
      { key: "__whats", valores: ["tem"] },
      { key: "contato", valores: [CONTATO_META.nunca.label] },
    ],
    sort: null,
  },
  { nome: "Deu sinal", filtros: [{ key: "porque", valores: ["Respondeu", "Abriu a proposta", "Clicou no e-mail"] }], sort: null },
  {
    nome: "Fechei",
    filtros: [
      { key: "__dia", valores: ["fechados"] },
      { key: "__encerrados", valores: ["sim"] },
    ],
    sort: null,
  },
];

type Painel =
  | { modo: "ficha" | "passo" | "contato" | "nota" | "chamar"; linha: LinhaFunil }
  | { modo: "passo-massa" }
  | null;

export function FunilLeadsTable({
  tableId,
  linhas,
  etapas,
  callbacks,
  propostas,
  orcamentos,
  leadFoco,
  fichaDe,
  fichaFooterExtra,
  acoesExtras,
  filtrosExtras,
  colunasExtras,
  csv,
  vazio,
  esperaTooltip = "A ficha já está pronta — ele entra na fila assim que abrir vaga na capacidade do dia.",
  toolbarDireita,
  kpis = true,
}: {
  /** Chave da persistência local (presets + filtros/ordem): "funil-rep", "funil-sistema"… */
  tableId: string;
  linhas: LinhaFunil[];
  /** Vocabulário de etapas do app (rótulos/cores; `encerra` marca ganho/fora). */
  etapas: EtapaFunilOpcao[];
  callbacks: FunilCallbacks;
  /** Sinais de proposta por leadId (coluna "Por que agora" + rótulo de ação). */
  propostas?: Record<string, PropostaResumo | undefined>;
  /** Orçamento existente por leadId (muda o rótulo da ação de orçamento). */
  orcamentos?: Record<string, OrcamentoResumo | undefined>;
  /** `?lead=` — abre a Ficha deste id na chegada. */
  leadFoco?: string | null;
  /** A Ficha completa é montada pelo wrapper (e-mails, peças, avisos, cadência). */
  fichaDe: (linha: LinhaFunil) => FichaLeadDados;
  /** Botões extras no rodapé da Ficha (ex.: prévia de toque no sistema). */
  fichaFooterExtra?: (linha: LinhaFunil, fechar: () => void) => ReactNode;
  /** Ações extras no menu "…" da linha (ex.: responder/atender pedido no sistema). */
  acoesExtras?: (linha: LinhaFunil) => Array<AcaoLinha | false | null | undefined>;
  /** Selects extras na barra de busca (ex.: campanha/segmento no sistema). */
  filtrosExtras?: SelectFilter[];
  /** Colunas extras entre "Próximo passo" e Ações. */
  colunasExtras?: Column<LinhaFunil>[];
  /** Prefixo do arquivo CSV ("meu-funil"). Ausente = sem botão de CSV. */
  csv?: string;
  vazio?: ReactNode;
  esperaTooltip?: string;
  toolbarDireita?: ReactNode;
  /** false = esconde a faixa do dia (ex.: vista embutida). */
  kpis?: boolean;
}) {
  const { confirm, confirmDialog } = useConfirm();
  const [pendente, startTransition] = useTransition();
  const [pendenteMassa, setPendenteMassa] = useState(false);
  const ocupado = pendente || pendenteMassa;

  // ------- estado dos filtros: colunas + sintéticos (__dia/__whats/__encerrados)
  // num ARRAY só — `PresetTabela {filtros; sort}` captura a vista inteira de graça.
  const [filtros, setFiltros] = useState<FiltroColuna[]>([]);
  const [sort, setSort] = useState<SortState | null>(null);
  const [busca, setBusca] = useState("");
  const [presetAtivo, setPresetAtivo] = useState<string | null>("Meu dia");
  const [salvos, setSalvos] = useState<PresetTabela[]>([]);
  const [salvarAberto, setSalvarAberto] = useState(false);

  const sinteticos = filtros.filter((f) => f.key.startsWith("__"));
  const filtrosTabela = filtros.filter((f) => !f.key.startsWith("__"));
  const diaSel = (filtros.find((f) => f.key === "__dia")?.valores ?? []) as BlocoDia[];
  const fWhats = filtros.find((f) => f.key === "__whats")?.valores[0] ?? "";
  const mostrarEncerrados = (filtros.find((f) => f.key === "__encerrados")?.valores.length ?? 0) > 0;

  function porSintetico(key: string, valores: string[] | null) {
    setFiltros((prev) => {
      const sem = prev.filter((f) => f.key !== key);
      return valores && valores.length > 0 ? [...sem, { key, valores }] : sem;
    });
    setPresetAtivo(null);
  }

  function toggleDia(b: BlocoDia) {
    const nova = diaSel.includes(b) ? diaSel.filter((x) => x !== b) : [...diaSel, b];
    porSintetico("__dia", nova);
  }

  // ------- persistência local (F5 não zera a vista; busca e página NÃO persistem)
  const chaveEstado = `jj:tabela:${tableId}:estado:v1`;
  const [hidratado, setHidratado] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(chaveEstado);
      if (raw) {
        const s = JSON.parse(raw) as { filtros?: FiltroColuna[]; sort?: SortState | null };
        if (Array.isArray(s.filtros)) {
          setFiltros(s.filtros);
          if (s.filtros.length > 0) setPresetAtivo(null);
        }
        if (s.sort != null) {
          setSort(s.sort);
          setPresetAtivo(null);
        }
      }
      setSalvos(lerPresets(tableId));
    } catch {
      // localStorage indisponível (SSR/privado): segue sem persistir.
    }
    setHidratado(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId]);
  useEffect(() => {
    if (!hidratado) return;
    try {
      localStorage.setItem(chaveEstado, JSON.stringify({ filtros, sort }));
    } catch {
      // sem persistência — a tela segue funcionando.
    }
  }, [filtros, sort, hidratado, chaveEstado]);

  function aplicarPreset(p: PresetTabela) {
    setFiltros(p.filtros);
    setSort(p.sort);
    setPresetAtivo(p.nome);
  }

  // ------- remendos otimistas: patch por id, limpo quando `linhas` troca de
  // identidade (o refresh do wrapper traz a verdade do servidor).
  const [remendos, setRemendos] = useState<Record<string, Partial<LinhaFunil>>>({});
  const linhasRef = useRef(linhas);
  useEffect(() => {
    if (linhasRef.current !== linhas) {
      linhasRef.current = linhas;
      setRemendos({});
    }
  }, [linhas]);

  // Vereditos de WhatsApp conferidos NESTA sessão — sobrevivem ao refresh
  // (conferir de novo custa o gateway; o overlay ganha do dado da linha).
  const [vereditos, setVereditos] = useState<Record<string, SituacaoWhats>>({});
  const [conferindo, setConferindo] = useState(false);
  const whatsDe = (l: LinhaFunil): SituacaoWhats => vereditos[l.id] ?? l.whats;

  const base = useMemo(
    () => linhas.map((l) => (remendos[l.id] ? { ...l, ...remendos[l.id] } : l)),
    [linhas, remendos],
  );

  // ------- painel (Ficha + modais). A Ficha usa a linha FRESCA da base.
  const [painel, setPainel] = useState<Painel>(null);
  const fechar = () => setPainel(null);
  const linhaPainel =
    painel && painel.modo !== "passo-massa" ? base.find((l) => l.id === painel.linha.id) ?? painel.linha : null;

  useEffect(() => {
    if (!leadFoco) return;
    const l = linhasRef.current.find((x) => x.id === leadFoco);
    if (l) setPainel({ modo: "ficha", linha: l });
  }, [leadFoco]);

  // ------- executor: action → remendo no sucesso → fecha modal; erro vira toast
  // (acima do modal — nunca um card morto atrás do backdrop).
  function rodar(fn: () => Promise<void>, opts?: { fecha?: boolean; remendo?: [string, Partial<LinhaFunil>] }) {
    startTransition(async () => {
      try {
        await fn();
        if (opts?.remendo) {
          const [id, patch] = opts.remendo;
          setRemendos((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
        }
        if (opts?.fecha !== false) setPainel(null);
      } catch (e) {
        toast.error("Não deu pra salvar", e instanceof Error ? e.message : "Tente de novo em instantes.");
      }
    });
  }

  async function moverEtapa(l: LinhaFunil, etapa: string) {
    if (!callbacks.onMoverEtapa || etapa === l.etapa) return;
    const alvo = etapas.find((e) => e.value === etapa);
    const quem = l.nome || l.empresa || "o contato";
    if (alvo?.encerra) {
      const ok = await confirm({
        title: alvo.encerra === "ganho" ? `Fechou com ${quem}?` : `Tirar ${quem} do funil?`,
        description:
          alvo.encerra === "ganho"
            ? "A conta sai do dia-a-dia e entra no bloco Fechei."
            : "A conta sai do funil (fica no histórico, fora do seu dia).",
        confirmLabel: alvo.label,
        tone: alvo.encerra === "fora" ? "danger" : undefined,
      });
      if (!ok) return;
      rodar(() => callbacks.onMoverEtapa!(l.id, etapa), { fecha: false, remendo: [l.id, { etapa }] });
      return;
    }
    const anterior = l.etapa;
    rodar(() => callbacks.onMoverEtapa!(l.id, etapa), { fecha: false, remendo: [l.id, { etapa }] });
    toast.desfazivel("Condição atualizada", `${quem} → ${alvo?.label ?? etapa}`, () =>
      rodar(() => callbacks.onMoverEtapa!(l.id, anterior), { fecha: false, remendo: [l.id, { etapa: anterior }] }),
    );
  }

  async function devolverIa(l: LinhaFunil) {
    if (!callbacks.onDevolverParaAutomacao) return;
    const ok = await confirm({
      title: "Deixar a IA cuidar deste contato?",
      description: `${l.nome || l.empresa || "O contato"} volta pra sequência automática de e-mails. Se responder ou der sinal de interesse, volta pra você.`,
      confirmLabel: "Deixa com a IA",
    });
    if (!ok) return;
    rodar(() => callbacks.onDevolverParaAutomacao!(l.id), { fecha: true, remendo: [l.id, { naMaquina: true }] });
  }

  async function descartar(l: LinhaFunil) {
    if (!callbacks.onDescartar) return;
    const quem = l.nome || l.empresa || "o contato";
    const ok = await confirm({
      title: "Tirar este contato da lista?",
      description: `${quem} sai do funil.${callbacks.onDesfazer ? " Dá pra desfazer logo em seguida." : ""}`,
      confirmLabel: "Tirar da lista",
      tone: "danger",
    });
    if (!ok) return;
    rodar(
      async () => {
        await callbacks.onDescartar!(l.id);
        if (callbacks.onDesfazer) {
          toast.desfazivel("Contato tirado da lista", quem, () => rodar(() => callbacks.onDesfazer!(l.id), { fecha: false }));
        }
      },
      { fecha: true },
    );
  }

  async function conferirWhats(alvos: LinhaFunil[]) {
    if (!callbacks.onVerificarWhats || conferindo || alvos.length === 0) return;
    setConferindo(true);
    setVereditos((prev) => ({ ...prev, ...Object.fromEntries(alvos.map((l) => [l.id, "checando" as SituacaoWhats])) }));
    try {
      for (let i = 0; i < alvos.length; i += LOTE_WHATS) {
        const lote = alvos.slice(i, i + LOTE_WHATS);
        const r = await callbacks.onVerificarWhats(lote.map((l) => l.id));
        setVereditos((prev) => ({ ...prev, ...r }));
        if (i + LOTE_WHATS < alvos.length) await new Promise((res) => setTimeout(res, PAUSA_WHATS_MS));
      }
    } catch {
      toast.error("Não deu pra conferir os números", "O servidor do WhatsApp não respondeu — tente de novo.");
    } finally {
      // Quem ficou "checando" (lote que falhou) volta pra "?".
      setVereditos((prev) =>
        Object.fromEntries(Object.entries(prev).map(([id, v]) => [id, v === "checando" ? "?" : v])) as Record<
          string,
          SituacaoWhats
        >,
      );
      setConferindo(false);
    }
  }

  // ------- seleção em massa
  const [selecionados, setSelecionados] = useState<Set<string | number>>(new Set());
  const selecionadasLinhas = base.filter((l) => selecionados.has(l.id));

  async function emMassa(rotulo: string, alvos: LinhaFunil[], fn: (l: LinhaFunil) => Promise<void>) {
    setPendenteMassa(true);
    let ok = 0;
    let erro = 0;
    for (const l of alvos) {
      try {
        await fn(l);
        ok++;
      } catch {
        erro++;
      }
    }
    setPendenteMassa(false);
    setSelecionados(new Set());
    if (erro > 0) toast.warning(`${rotulo}: ${ok} de ${alvos.length}`, `${erro} deram erro — tente de novo.`);
    else toast.success(`${rotulo}: ${ok} contato${ok === 1 ? "" : "s"}`);
  }

  // ------- a lista mostrada: corte vivo (VISÍVEL no chip) → busca → blocos do
  // dia → WhatsApp → Ordem do dia. Os filtros DE COLUNA quem aplica é a DataTable.
  const limite = fimDeHoje();
  const mostrados = useMemo(() => {
    const q = busca.trim();
    const soDigitos = q.replace(/\D/g, "");
    let lista = base;
    // Sem busca, o dia-a-dia esconde encerrado (ganho/fora) — a MESMA regra de
    // sempre, só que agora com chip contando a verdade. Busca ignora o corte.
    if (!q && !mostrarEncerrados) {
      lista = lista.filter((l) => {
        const fim = encerraDe(l.etapa, etapas);
        return !fim || (fim === "ganho" && diaSel.includes("fechados"));
      });
    }
    if (soDigitos.length >= 4) {
      lista = lista.filter((l) => (l.telefone ?? "").replace(/\D/g, "").includes(soDigitos));
    } else if (q) {
      lista = lista.filter((l) => rowMatchesQuery(l, q, ["nome", "empresa", "cidade", "email", "segmento", "telefone"]));
    }
    if (diaSel.length > 0) {
      lista = lista.filter((l) => diaSel.some((b) => noBloco(l, b, limite, etapas)));
    }
    if (fWhats) {
      lista = lista.filter((l) => {
        const v = whatsDe(l);
        return fWhats === "tem" ? v === "tem" : fWhats === "nao" ? v === "nao" : v === "?" || v === "checando";
      });
    }
    // Pré-ordena SEMPRE: sem sort ativo esta É a ordem; com sort, a DataTable
    // ordena por cima e "tirar o chip" volta pra cá.
    return ordemDoDia(lista, etapas, propostas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, busca, diaSel.join("|"), fWhats, mostrarEncerrados, etapas, vereditos, propostas, limite]);

  // ------- contagens da faixa do dia: sobre a BASE (estáveis, não dançam com filtro)
  const contagens = useMemo(() => {
    const c = Object.fromEntries(BLOCOS_DIA.map((b) => [b, 0])) as Record<BlocoDia, number>;
    for (const l of base) for (const b of BLOCOS_DIA) if (noBloco(l, b, limite, etapas)) c[b]++;
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, etapas, limite]);

  const etapaMetaDe = (v: string): EtapaFunilOpcao => etapas.find((e) => e.value === v) ?? { value: v, label: v };

  // ------- colunas (todas com `value` = ordenável + facetável; "Quem" só ordena)
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

  const colunas: Column<LinhaFunil>[] = [
    {
      key: "quem",
      header: "Quem",
      headerLabel: "Quem",
      value: (l) => l.nome || l.empresa || "",
      filterable: false,
      render: (l) => (
        <Stack gap={0.5} minW="240px" maxW="360px">
          <HStack gap={1.5} minW={0}>
            <LeadKindBadge source={l.source ?? null} origin={l.origem ?? null} />
            <Text fontSize="sm" fontWeight={600} lineClamp={1} color="var(--admin-text)">
              {l.nome || l.empresa || "—"}
            </Text>
          </HStack>
          <Text fontSize="xs" color="var(--admin-text-soft)" lineClamp={1}>
            {[l.empresa && l.empresa !== (l.nome || "") ? l.empresa : null, l.cidade].filter(Boolean).join(" · ") ||
              l.email ||
              "—"}
          </Text>
          <Box onClick={stop} w="fit-content">
            <NumeroWhats numero={l.telefone} situacao={whatsDe(l)} fontSize="xs" />
          </Box>
        </Stack>
      ),
    },
    {
      key: "porque",
      header: "Por que agora",
      headerLabel: "Por que agora",
      width: "200px",
      value: (l) => sinalDe(l, propostas?.[l.id]).rotulo,
      render: (l) => {
        const s = sinalDe(l, propostas?.[l.id]);
        const frase = l.handoff?.plano || l.handoff?.porque?.[0] || l.handoff?.motivo || null;
        return (
          <Stack gap={0.5} minW={0}>
            <Box w="fit-content">
              <Tag bg={s.bg} color={s.color}>
                {s.rotulo}
                {s.detalhe ? ` ${s.detalhe}` : ""}
              </Tag>
            </Box>
            {frase ? (
              <Text fontSize="xs" color="var(--admin-text-soft)" lineClamp={1} title={frase}>
                {frase}
              </Text>
            ) : null}
          </Stack>
        );
      },
    },
    {
      key: "etapa",
      header: "Condição",
      headerLabel: "Condição",
      width: "150px",
      value: (l) => etapaMetaDe(l.etapa).label,
      render: (l) => {
        const m = etapaMetaDe(l.etapa);
        const tag = (
          <Tag bg={m.bg ?? "rgba(100,116,139,0.14)"} color={m.color ?? "#475569"} title={m.hint}>
            {m.label}
            {callbacks.onMoverEtapa ? " ▾" : ""}
          </Tag>
        );
        return callbacks.onMoverEtapa ? (
          <InlineSelect
            value={l.etapa}
            options={etapas.map((e) => ({ value: e.value, label: e.label }))}
            onChange={(v) => void moverEtapa(l, v)}
            render={() => tag}
          />
        ) : (
          tag
        );
      },
    },
    {
      key: "contato",
      header: "Falei?",
      headerLabel: "Falei?",
      width: "150px",
      value: (l) => CONTATO_META[l.contato.estado].label,
      render: (l) => {
        const m = CONTATO_META[l.contato.estado];
        return (
          <HStack gap={1.5}>
            <Stack gap={0.5}>
              <Box w="fit-content">
                <Tag bg={m.bg} color={m.color}>
                  {m.label}
                </Tag>
              </Box>
              {l.contato.em ? (
                <Text fontSize="xs" color="var(--admin-text-soft)">
                  {fmtData(l.contato.em)}
                </Text>
              ) : null}
            </Stack>
            {callbacks.onRegistrarContato ? (
              <Box onClick={stop}>
                <AcaoIcone
                  tone="confirmar"
                  title="Registrar contato — falei ou tentei"
                  onClick={() => setPainel({ modo: "contato", linha: l })}
                >
                  <PhoneCall size={14} />
                </AcaoIcone>
              </Box>
            ) : null}
          </HStack>
        );
      },
    },
    {
      key: "passo",
      header: "Próximo passo",
      headerLabel: "Próximo passo",
      value: (l) => (l.proximaAcaoEm ? new Date(l.proximaAcaoEm) : null),
      render: (l) => {
        if (l.naEspera) {
          return (
            <HStack gap={1.5} title={esperaTooltip} minW={0}>
              <Hourglass size={13} color="#a16207" style={{ flexShrink: 0 }} />
              <Stack gap={0} minW={0}>
                <Text fontSize="sm" color="var(--admin-text)">
                  Esperando a vez
                </Text>
                <Text fontSize="xs" color="var(--admin-text-soft)" lineClamp={1}>
                  {l.handoff?.plano || "Entra na fila assim que abrir vaga."}
                </Text>
              </Stack>
            </HStack>
          );
        }
        if (!l.proximaAcaoEm) {
          return callbacks.onMarcarPasso ? (
            <Box onClick={stop} w="fit-content">
              <Button size="xs" tone="ghost" onClick={() => setPainel({ modo: "passo", linha: l })}>
                <Box as="span" color="#b91c1c" display="inline-flex" alignItems="center" gap="4px">
                  <AlertTriangle size={13} /> Marcar o que fazer
                </Box>
              </Button>
            </Box>
          ) : (
            <Text fontSize="xs" color="var(--admin-text-soft)">
              —
            </Text>
          );
        }
        const atrasado = new Date(l.proximaAcaoEm).getTime() <= limite;
        return (
          <HStack gap={1.5} minW={0}>
            <Stack gap={0} minW={0}>
              <Text fontSize="sm" lineClamp={1} color="var(--admin-text)" title={l.proximaAcao ?? undefined}>
                {l.proximaAcao || "—"}
              </Text>
              <Text fontSize="xs" fontWeight={atrasado ? 700 : 400} color={atrasado ? "#b91c1c" : "var(--admin-text-soft)"}>
                {atrasado ? "pra hoje · " : ""}
                {fmtDia(l.proximaAcaoEm)}
              </Text>
            </Stack>
            {callbacks.onConcluirPasso ? (
              <Box onClick={stop}>
                <AcaoIcone
                  tone="confirmar"
                  title="Já fiz — registra e libera o próximo passo"
                  disabled={ocupado}
                  onClick={() =>
                    rodar(() => callbacks.onConcluirPasso!(l.id), {
                      fecha: false,
                      remendo: [l.id, { proximaAcao: null, proximaAcaoEm: null }],
                    })
                  }
                >
                  <Check size={14} />
                </AcaoIcone>
              </Box>
            ) : null}
          </HStack>
        );
      },
    },
    ...(callbacks.onExplicarScore
      ? ([
          {
            key: "score",
            header: "Score",
            headerLabel: "Score",
            width: "90px",
            value: (l) => l.score ?? null,
            render: (l) => (
              <Box onClick={stop} w="fit-content">
                <Button size="xs" tone="ghost" onClick={() => callbacks.onExplicarScore!(l)} title="Por que este score?">
                  {l.score ?? "—"}
                </Button>
              </Box>
            ),
          },
        ] as Column<LinhaFunil>[])
      : []),
    ...(colunasExtras ?? []),
  ];

  const valueDe = (key: string) => colunas.find((c) => c.key === key)?.value;

  // ------- ações por linha: 3 botões FIXOS (mesma posição SEMPRE; sem callback
  // ou sem dado = esmaecido, nunca removido) + menu "…" com o resto.
  function acoesDaLinha(l: LinhaFunil) {
    const fone = (l.telefone ?? "").replace(/\D/g, "");
    const temProposta = Boolean(propostas?.[l.id]);
    const orc = orcamentos?.[l.id];
    const pedidoAberto = Boolean(l.pedidoJose?.abertoEm && !l.pedidoJose?.atendidoEm);
    const acoes: Array<AcaoLinha | false | null | undefined> = [
      !!callbacks.onEnviarWhats && {
        label: "WhatsApp",
        primaria: true,
        tone: "whatsapp",
        icon: <MessageCircle size={14} />,
        disabled: !fone,
        hint: fone ? "Abrir a conversa no WhatsApp" : "Este contato não tem telefone",
        onClick: () => callbacks.onEnviarWhats!(l, fone),
      },
      !!callbacks.onRegistrarContato && {
        label: "Registrar contato",
        primaria: true,
        icon: <PhoneCall size={14} />,
        hint: "Falei, ou tentei e não consegui",
        onClick: () => setPainel({ modo: "contato", linha: l }),
      },
      !!callbacks.onMarcarPasso && {
        label: "Próximo passo",
        primaria: true,
        icon: <CalendarClock size={14} />,
        hint: "O que fazer com este contato, e quando",
        onClick: () => setPainel({ modo: "passo", linha: l }),
      },
      !!(l.proximaAcaoEm && callbacks.onConcluirPasso) && {
        label: "Já fiz",
        icon: <Check size={14} />,
        hint: "Registra nas notas e libera o próximo passo",
        disabled: ocupado,
        onClick: () =>
          rodar(() => callbacks.onConcluirPasso!(l.id), {
            fecha: false,
            remendo: [l.id, { proximaAcao: null, proximaAcaoEm: null }],
          }),
      },
      !!callbacks.onNota && {
        label: "Nota",
        icon: <StickyNote size={14} />,
        hint: "Escrever o que aconteceu",
        onClick: () => setPainel({ modo: "nota", linha: l }),
      },
      !!callbacks.onAbrirProposta && {
        label: temProposta ? "Nova proposta" : "Gerar proposta",
        icon: <FileText size={14} />,
        hint: "Proposta pronta pra mandar (site + IA)",
        onClick: () => callbacks.onAbrirProposta!(l),
      },
      !!callbacks.onAbrirOrcamento &&
        (orc
          ? {
              label: "Orçamento no WhatsApp",
              icon: <Receipt size={14} />,
              hint: `${orc.numero ?? "Orçamento"} — copiar o link ou mandar no WhatsApp`,
              onClick: () => callbacks.onAbrirOrcamento!(l),
            }
          : temProposta && {
              label: "Gerar orçamento",
              icon: <Receipt size={14} />,
              hint: "Orçamento pela proposta — você confirma os valores",
              onClick: () => callbacks.onAbrirOrcamento!(l),
            }),
      !!callbacks.onEmail && {
        label: "Mandar e-mail",
        icon: <Mail size={14} />,
        disabled: !l.email,
        hint: l.email ? "Escrever um e-mail pra este contato" : "Este contato não tem e-mail",
        onClick: () => callbacks.onEmail!(l),
      },
      {
        label: "Ficha",
        icon: <Inbox size={14} />,
        hint: "Tudo deste contato numa tela só",
        onClick: () => setPainel({ modo: "ficha", linha: l }),
      },
      ...(pedidoAberto && callbacks.onRetirarPedido
        ? ([
            {
              label: "Retirar o pedido ao José",
              icon: <Headset size={14} />,
              hint: `José avisado em ${fmtData(l.pedidoJose!.abertoEm)} — retire se você resolver antes`,
              disabled: ocupado,
              onClick: () =>
                rodar(() => callbacks.onRetirarPedido!(l.id), {
                  fecha: false,
                  remendo: [l.id, { pedidoJose: null }],
                }),
            },
          ] as AcaoLinha[])
        : !pedidoAberto && callbacks.onChamarJose
          ? ([
              {
                label: "Chamar o José",
                icon: <Headset size={14} />,
                hint: "Avisa o dono na hora, com o motivo e o link da ficha",
                onClick: () => setPainel({ modo: "chamar", linha: l }),
              },
            ] as AcaoLinha[])
          : []),
      !!(l.voltaIa?.pode && callbacks.onDevolverParaAutomacao) && {
        label: "Deixa a IA cuidar",
        icon: <Bot size={14} />,
        hint: "Volta pra sequência automática de e-mails",
        disabled: ocupado,
        onClick: () => void devolverIa(l),
      },
      !!(callbacks.onMarcarSemWhats && whatsDe(l) !== "nao") && {
        label: "Marcar sem WhatsApp",
        icon: <PhoneOff size={14} />,
        hint: "O número não tem WhatsApp — sai da fila de envio",
        disabled: ocupado,
        onClick: () => rodar(() => callbacks.onMarcarSemWhats!(l.id), { fecha: false, remendo: [l.id, { whats: "nao" }] }),
      },
      ...(acoesExtras?.(l) ?? []),
      !!callbacks.onDescartar && {
        label: "Tirar da lista",
        icon: <Trash2 size={14} />,
        danger: true,
        hint: "Descarta este contato do funil",
        onClick: () => void descartar(l),
      },
    ];
    return <AcoesLinha acoes={acoes} max={3} />;
  }

  // ------- toolbar: busca + Minhas listas + conferir WhatsApp + CSV + contador
  const aConferir = mostrados.filter((l) => l.telefone && whatsDe(l) === "?");
  const visiveisN = aplicarFiltros(mostrados, filtrosTabela, valueDe).length;

  function linhasParaCsv(): LinhaFunil[] {
    const f = aplicarFiltros(mostrados, filtrosTabela, valueDe);
    const v = sort ? valueDe(sort.key) : undefined;
    return sort && v ? ordenarLinhas(f, v, sort.dir) : f;
  }

  function exportCsv(lista: LinhaFunil[]) {
    if (!csv) return;
    const cab = ["Nome", "Empresa", "Cidade", "E-mail", "Telefone", "WhatsApp", "Condição", "Falei", "Por que agora", "Próximo passo", "Quando", "Entrou"];
    const linhasCsv = lista.map((l) => [
      l.nome ?? "",
      l.empresa ?? "",
      l.cidade ?? "",
      l.email ?? "",
      l.telefone ?? "",
      whatsDe(l) === "tem" ? "Sim" : whatsDe(l) === "nao" ? "Não" : "?",
      etapaMetaDe(l.etapa).label,
      CONTATO_META[l.contato.estado].label,
      sinalDe(l, propostas?.[l.id]).rotulo,
      l.proximaAcao ?? "",
      l.proximaAcaoEm ? fmtDia(l.proximaAcaoEm) : "",
      fmtDia(l.criadoEm),
    ]);
    const texto = [cab, ...linhasCsv]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    const blob = new Blob(["﻿" + texto], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const sufixo = (presetAtivo ?? "lista").toLowerCase().replace(/\s+/g, "-");
    a.download = `${csv}-${sufixo}-${diaLocal()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const itensListas: ActionMenuItem[] = [
    ...PRESETS_FIXOS.map((p) => ({
      label: presetAtivo === p.nome ? `✓ ${p.nome}` : p.nome,
      onClick: () => aplicarPreset(p),
    })),
    ...salvos.map((p) => ({
      label: presetAtivo === p.nome ? `✓ ${p.nome}` : p.nome,
      hint: "sua lista",
      onClick: () => aplicarPreset(p),
    })),
    { label: "Salvar/apagar listas…", icon: <ListChecks size={14} />, onClick: () => setSalvarAberto(true) },
  ];

  const selectWhats: SelectFilter = {
    value: fWhats,
    onChange: (v) => porSintetico("__whats", v ? [v] : null),
    options: [
      { value: "", label: "WhatsApp: todos" },
      { value: "tem", label: "Tem WhatsApp" },
      { value: "?", label: "Não conferido" },
      { value: "nao", label: "Sem WhatsApp" },
    ],
  };

  const toolbar = (
    <Stack gap={2}>
      <FilterBar
        attached
        search={busca}
        onSearch={setBusca}
        placeholder="Buscar por nome, empresa, cidade ou telefone…"
        selects={[selectWhats, ...(filtrosExtras ?? [])]}
        right={
          <HStack gap={2} flexWrap="wrap">
            <ActionMenu label="Minhas listas" icon={<ListChecks size={14} />} items={itensListas} size="sm" tone="outline" />
            {callbacks.onVerificarWhats && aConferir.length > 0 ? (
              <Button size="sm" tone="outline" disabled={conferindo} onClick={() => void conferirWhats(aConferir)}>
                {conferindo ? "Conferindo…" : `Conferir WhatsApp (${aConferir.length})`}
              </Button>
            ) : null}
            {csv ? (
              <AcaoIcone tone="neutro" title="Baixar CSV do que está na tela" size="sm" onClick={() => exportCsv(linhasParaCsv())}>
                <Download size={15} />
              </AcaoIcone>
            ) : null}
            <Text fontSize="xs" color="var(--admin-text-soft)" flexShrink={0}>
              {visiveisN} de {linhas.length}
            </Text>
            {toolbarDireita}
          </HStack>
        }
      />
      {selecionados.size > 0 ? (
        <HStack gap={2} flexWrap="wrap" px={2} py={1.5} borderRadius="10px" bg="var(--admin-nav-active)">
          <Text fontSize="sm" fontWeight={700} color="var(--admin-text)">
            {selecionados.size} selecionado{selecionados.size === 1 ? "" : "s"}
          </Text>
          {callbacks.onVerificarWhats ? (
            <Button
              size="xs"
              tone="outline"
              disabled={conferindo}
              onClick={() => void conferirWhats(selecionadasLinhas.filter((l) => l.telefone))}
            >
              Conferir WhatsApp
            </Button>
          ) : null}
          {callbacks.onMarcarPasso ? (
            <Button size="xs" tone="outline" disabled={ocupado} onClick={() => setPainel({ modo: "passo-massa" })}>
              Marcar passo pra todos…
            </Button>
          ) : null}
          {callbacks.onDevolverParaAutomacao ? (
            <Button
              size="xs"
              tone="outline"
              disabled={ocupado}
              onClick={async () => {
                const elegiveis = selecionadasLinhas.filter((l) => l.voltaIa?.pode);
                if (elegiveis.length === 0) {
                  toast.info("Ninguém elegível", "Nenhum dos selecionados pode voltar pra automação agora.");
                  return;
                }
                const fora = selecionadasLinhas.length - elegiveis.length;
                const ok = await confirm({
                  title: `Deixar ${elegiveis.length} contato${elegiveis.length === 1 ? "" : "s"} com a IA?`,
                  description: `Voltam pra sequência automática de e-mails.${fora > 0 ? ` ${fora} não ${fora === 1 ? "pode" : "podem"} e ${fora === 1 ? "fica" : "ficam"} como ${fora === 1 ? "está" : "estão"}.` : ""}`,
                  confirmLabel: "Deixa com a IA",
                });
                if (!ok) return;
                await emMassa("Deixei com a IA", elegiveis, (l) => callbacks.onDevolverParaAutomacao!(l.id));
              }}
            >
              Deixar com a IA…
            </Button>
          ) : null}
          {callbacks.onDescartar ? (
            <Button
              size="xs"
              tone="danger"
              disabled={ocupado}
              onClick={async () => {
                const ok = await confirm({
                  title: `Tirar ${selecionados.size} contato${selecionados.size === 1 ? "" : "s"} da lista?`,
                  description: "Saem do funil.",
                  confirmLabel: "Tirar da lista",
                  tone: "danger",
                });
                if (!ok) return;
                await emMassa("Tirei da lista", selecionadasLinhas, (l) => callbacks.onDescartar!(l.id));
              }}
            >
              Tirar da lista…
            </Button>
          ) : null}
          {csv ? (
            <Button size="xs" tone="ghost" onClick={() => exportCsv(selecionadasLinhas)}>
              CSV
            </Button>
          ) : null}
          <Button size="xs" tone="ghost" onClick={() => setSelecionados(new Set())}>
            Limpar seleção
          </Button>
        </HStack>
      ) : null}
    </Stack>
  );

  // ------- chips dos filtros que vivem fora das colunas (o "invisível" fica visível)
  const chipsExtras = (
    <>
      {diaSel.map((b) => (
        <ChipFiltro key={b} onRemove={() => toggleDia(b)} removeLabel={`Tirar ${BLOCO_META[b].label}`}>
          Dia: {BLOCO_META[b].label}
        </ChipFiltro>
      ))}
      {fWhats ? (
        <ChipFiltro onRemove={() => porSintetico("__whats", null)} removeLabel="Tirar o filtro de WhatsApp">
          {selectWhats.options.find((o) => o.value === fWhats)?.label ?? "WhatsApp"}
        </ChipFiltro>
      ) : null}
      {!mostrarEncerrados && !busca.trim() ? (
        <ChipFiltro onRemove={() => porSintetico("__encerrados", ["sim"])} removeLabel="Mostrar também fechados e fora">
          Sem os fechados/fora
        </ChipFiltro>
      ) : null}
      {mostrarEncerrados ? (
        <ChipFiltro onRemove={() => porSintetico("__encerrados", null)} removeLabel="Voltar a esconder fechados e fora">
          Mostrando fechados e fora
        </ChipFiltro>
      ) : null}
    </>
  );

  const kpiItens: KpiRowItem[] = BLOCOS_DIA.map((b) => ({
    label: BLOCO_META[b].label,
    value: contagens[b],
    tone: BLOCO_META[b].tone,
    onClick: () => toggleDia(b),
    active: diaSel.includes(b),
  }));

  // ------- footer da Ficha (as mesmas ações da linha, com rótulo por extenso)
  function fichaFooter(l: LinhaFunil) {
    const fone = (l.telefone ?? "").replace(/\D/g, "");
    const temProposta = Boolean(propostas?.[l.id]);
    const pedidoAberto = Boolean(l.pedidoJose?.abertoEm && !l.pedidoJose?.atendidoEm);
    return (
      <HStack gap={2} justify="flex-end" flexWrap="wrap" w="full">
        {callbacks.onNota ? (
          <Button size="sm" tone="ghost" onClick={() => setPainel({ modo: "nota", linha: l })}>
            <StickyNote size={14} /> Nota
          </Button>
        ) : null}
        {callbacks.onRegistrarContato ? (
          <Button size="sm" tone="outline" onClick={() => setPainel({ modo: "contato", linha: l })}>
            <PhoneCall size={14} /> Registrar contato
          </Button>
        ) : null}
        {callbacks.onAbrirProposta && !temProposta ? (
          <Button size="sm" tone="outline" onClick={() => callbacks.onAbrirProposta!(l)}>
            <FileText size={14} /> Gerar proposta
          </Button>
        ) : null}
        {l.proximaAcaoEm && callbacks.onConcluirPasso ? (
          <Button
            size="sm"
            tone="outline"
            disabled={ocupado}
            onClick={() =>
              rodar(() => callbacks.onConcluirPasso!(l.id), {
                fecha: false,
                remendo: [l.id, { proximaAcao: null, proximaAcaoEm: null }],
              })
            }
          >
            <Check size={14} /> Já fiz
          </Button>
        ) : null}
        {pedidoAberto && callbacks.onRetirarPedido ? (
          <Button
            size="sm"
            tone="ghost"
            title={`José avisado em ${fmtData(l.pedidoJose!.abertoEm)}`}
            disabled={ocupado}
            onClick={() => rodar(() => callbacks.onRetirarPedido!(l.id), { fecha: false, remendo: [l.id, { pedidoJose: null }] })}
          >
            <Headset size={14} /> Retirar o pedido
          </Button>
        ) : !pedidoAberto && callbacks.onChamarJose ? (
          <Button size="sm" tone="outline" onClick={() => setPainel({ modo: "chamar", linha: l })}>
            <Headset size={14} /> Chamar o José
          </Button>
        ) : null}
        {l.voltaIa?.pode && callbacks.onDevolverParaAutomacao ? (
          <Button size="sm" tone="outline" disabled={ocupado} onClick={() => void devolverIa(l)}>
            <Bot size={14} /> Deixa a IA cuidar
          </Button>
        ) : null}
        {fichaFooterExtra?.(l, fechar)}
        {callbacks.onMarcarPasso ? (
          <Button size="sm" tone="primary" onClick={() => setPainel({ modo: "passo", linha: l })}>
            <CalendarClock size={14} /> Próximo passo
          </Button>
        ) : null}
        {fone && callbacks.onEnviarWhats ? (
          <Button size="sm" tone="whatsapp" onClick={() => callbacks.onEnviarWhats!(l, fone)}>
            <MessageCircle size={14} /> WhatsApp
          </Button>
        ) : null}
      </HStack>
    );
  }

  return (
    <Stack gap={3}>
      {kpis ? <KpiRow items={kpiItens} /> : null}
      <DataTable<LinhaFunil>
        columns={colunas}
        rows={mostrados}
        getRowKey={(l) => l.id}
        titulo="Funil"
        empty={
          vazio ?? (
            <Text fontSize="sm" color="var(--admin-text-soft)">
              Nenhum contato nesta vista — mude os filtros ou espere a máquina entregar.
            </Text>
          )
        }
        onRowClick={(l) => setPainel({ modo: "ficha", linha: l })}
        actions={acoesDaLinha}
        actionsWidth="176px"
        toolbar={toolbar}
        chipsExtras={chipsExtras}
        sort={sort}
        onSortChange={(s) => {
          setSort(s);
          setPresetAtivo(null);
        }}
        filtros={filtrosTabela}
        onFiltrosChange={(f) => {
          setFiltros((prev) => [...prev.filter((x) => x.key.startsWith("__")), ...f]);
          setPresetAtivo(null);
        }}
        selection={{
          selectedKeys: selecionados,
          onToggle: (key, checked) =>
            setSelecionados((prev) => {
              const n = new Set(prev);
              if (checked) n.add(key);
              else n.delete(key);
              return n;
            }),
          onToggleAll: (keys, checked) =>
            setSelecionados((prev) => {
              const n = new Set(prev);
              for (const k of keys) {
                if (checked) n.add(k);
                else n.delete(k);
              }
              return n;
            }),
        }}
      />

      {painel?.modo === "ficha" && linhaPainel ? (
        <FichaLead
          open
          onClose={fechar}
          dados={fichaDe(linhaPainel)}
          etapas={etapas}
          onEtapa={callbacks.onMoverEtapa ? (v) => void moverEtapa(linhaPainel, v) : undefined}
          footer={fichaFooter(linhaPainel)}
        />
      ) : null}

      {painel?.modo === "passo" && linhaPainel ? (
        <PassoModal
          linha={linhaPainel}
          pendente={ocupado}
          onClose={fechar}
          onSalvar={(acao, dia) =>
            rodar(() => callbacks.onMarcarPasso!(linhaPainel.id, acao, dia), {
              remendo: [linhaPainel.id, { proximaAcao: acao, proximaAcaoEm: `${dia}T12:00:00` }],
            })
          }
        />
      ) : null}

      {painel?.modo === "passo-massa" ? (
        <PassoModal
          linha={null}
          titulo={`Próximo passo — ${selecionados.size} contato${selecionados.size === 1 ? "" : "s"}`}
          pendente={ocupado}
          onClose={fechar}
          onSalvar={async (acao, dia) => {
            setPainel(null);
            await emMassa("Passo marcado", selecionadasLinhas, (l) => callbacks.onMarcarPasso!(l.id, acao, dia));
          }}
        />
      ) : null}

      {painel?.modo === "contato" && linhaPainel ? (
        <ContatoModal
          linha={linhaPainel}
          pendente={ocupado}
          onClose={fechar}
          onSalvar={(dados) =>
            rodar(() => callbacks.onRegistrarContato!(linhaPainel.id, dados), {
              remendo: [
                linhaPainel.id,
                { contato: { estado: dados.falou ? "falou" : "tentou", em: new Date().toISOString() } },
              ],
            })
          }
        />
      ) : null}

      {painel?.modo === "nota" && linhaPainel ? (
        <NotaModal
          linha={linhaPainel}
          pendente={ocupado}
          onClose={fechar}
          onSalvar={(texto) =>
            rodar(() => callbacks.onNota!(linhaPainel.id, texto), {
              remendo: [linhaPainel.id, { notas: [texto, ...linhaPainel.notas] }],
            })
          }
        />
      ) : null}

      {painel?.modo === "chamar" && linhaPainel ? (
        <ChamarJoseModal
          linha={linhaPainel}
          pendente={ocupado}
          onClose={fechar}
          onChamar={(motivo) =>
            rodar(() => callbacks.onChamarJose!(linhaPainel.id, motivo), {
              remendo: [linhaPainel.id, { pedidoJose: { abertoEm: new Date().toISOString(), atendidoEm: null } }],
            })
          }
        />
      ) : null}

      {salvarAberto ? (
        <SalvarListasModal
          tableId={tableId}
          salvos={salvos}
          filtrosAtuais={filtros}
          sortAtual={sort}
          onFechar={() => setSalvarAberto(false)}
          onMudou={(lista, aplicou) => {
            setSalvos(lista);
            if (aplicou) setPresetAtivo(aplicou);
          }}
        />
      ) : null}

      {confirmDialog}
    </Stack>
  );
}

/** Gerencia as listas salvas da operadora: salvar a vista de agora, apagar as velhas. */
function SalvarListasModal({
  tableId,
  salvos,
  filtrosAtuais,
  sortAtual,
  onFechar,
  onMudou,
}: {
  tableId: string;
  salvos: PresetTabela[];
  filtrosAtuais: FiltroColuna[];
  sortAtual: SortState | null;
  onFechar: () => void;
  onMudou: (lista: PresetTabela[], aplicou?: string) => void;
}) {
  const [nome, setNome] = useState("");
  const pronto = nome.trim().length >= 2;

  function salvar() {
    const n = nome.trim();
    if (!n) return;
    const lista = [...salvos.filter((p) => p.nome !== n), { nome: n, filtros: filtrosAtuais, sort: sortAtual }];
    gravarPresets(tableId, lista);
    onMudou(lista, n);
    toast.success("Lista salva", `"${n}" agora aparece em Minhas listas.`);
    onFechar();
  }

  function apagar(n: string) {
    const lista = salvos.filter((p) => p.nome !== n);
    gravarPresets(tableId, lista);
    onMudou(lista);
  }

  return (
    <Modal
      open
      onClose={onFechar}
      title="Minhas listas"
      size="sm"
      footer={
        <HStack gap={2} justify="flex-end" w="full">
          <Button tone="ghost" onClick={onFechar}>
            Fechar
          </Button>
          <Button tone="primary" disabled={!pronto} onClick={salvar}>
            Salvar a lista de agora
          </Button>
        </HStack>
      }
    >
      <FormInput
        label="Nome da lista"
        placeholder="Ex.: Quentes do ABC"
        value={nome}
        maxLength={40}
        onChange={(e) => setNome(e.currentTarget.value)}
        help="Salva os filtros e a ordem que estão aplicados agora."
      />
      {salvos.length > 0 ? (
        <Stack gap={1}>
          <Text fontSize="xs" fontWeight={700} textTransform="uppercase" letterSpacing="0.04em" color="var(--admin-text-soft)">
            Salvas
          </Text>
          {salvos.map((p) => (
            <HStack key={p.nome} justify="space-between" px={2} py={1} borderRadius="8px" _hover={{ bg: "var(--admin-nav-hover)" }}>
              <Text fontSize="sm" color="var(--admin-text)">
                {p.nome}
              </Text>
              <Button size="xs" tone="ghost" onClick={() => apagar(p.nome)} title={`Apagar "${p.nome}"`}>
                <Trash2 size={13} />
              </Button>
            </HStack>
          ))}
        </Stack>
      ) : (
        <Text fontSize="sm" color="var(--admin-text-soft)">
          Nenhuma lista salva ainda — monte os filtros na tela e salve aqui.
        </Text>
      )}
    </Modal>
  );
}
