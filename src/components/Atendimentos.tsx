"use client";

import { useMemo, useState } from "react";
import { Box, chakra, HStack, Stack, Text } from "@chakra-ui/react";
import { ExternalLink, FileText, Globe, Inbox, Mail, Megaphone, MessageCircle, MessageSquareText, Sparkles } from "lucide-react";
import { Screen } from "./Screen";
import { AcaoIcone } from "./AcaoIcone";
import { DataTable, type Column } from "./DataTable";
import { FilterBar } from "./FilterBar";
import { Tag } from "./Badge";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { FichaLead, type FichaLeadDados } from "./FichaLead";
import { KpiRow } from "./KpiCard";
import type { AtendimentoCanal } from "../atendimento";

/**
 * ATENDIMENTO — **quem procurou você**, a mesma tela nos dois painéis.
 *
 * Duas portas dão nesta lista, e só duas:
 *  • o **formulário do site** (o de contato e o de cotação);
 *  • o **orçamento preenchido na PROPOSTA** — a peça de uma empresa
 *    (`/proposta/<código>`) tem o mesmo formulário, e quem preenche lá chega
 *    aqui já com a proposta que estava lendo no bolso.
 *
 * Não é o funil e não repete o funil: aqui é a CAIXA (chegou, o que escreveu,
 * responder agora); lá é o TRABALHO (a fila do dia, a etapa, o próximo passo).
 * O mesmo contato aparece nos dois — a lista é uma só, o recorte é que muda.
 * Por isso a linha leva direto pro funil em vez de ganhar um segundo lugar pra
 * mover etapa: foi trabalhar o mesmo lead em duas telas que aposentou a
 * Atendimentos antiga.
 *
 * Componente PURO (molde do `MailClient`): dados e callbacks por props, ações do
 * painel por conta de quem chama. É literalmente a MESMA tela no sistema e no
 * representante — o que muda entre eles é o ícone do menu, e ele mora no menu.
 * Escrever a segunda seria garantir que as duas divergissem no primeiro ajuste.
 *
 * ⚠️ Aqui NÃO se escreve `mailto:` nem `wa.me`: falar com quem chegou é trabalho
 * do painel (a conversa abre no FAB do WhatsApp, o e-mail abre no compositor da
 * caixa) e o registro do contato depende disso. Link externo joga a pessoa pra
 * fora e o painel nunca fica sabendo que houve conversa. Por isso as três ações
 * são CALLBACKS injetados (`onWhats`/`onEmail`/`onIa`) — quem não passa, não
 * mostra o botão.
 */

export type AtendimentoItem = {
  id: string;
  nome: string;
  empresa?: string | null;
  email: string | null;
  /** Só os dígitos, prontos pra enviar (é o que o `onWhats` recebe). */
  telefone: string | null;
  canal: AtendimentoCanal;
  /** Onde exatamente ("josejunior.dev", "Impex Serviços", "petshop"). */
  origem: string;
  /** A peça que ele preencheu (a proposta, a landing) — abre em nova aba. */
  origemUrl?: string | null;
  assunto: string | null;
  mensagem: string | null;
  /** ISO da chegada (ou da última vez que ele voltou). */
  quando: string;
  /** Já saiu do "novo" — alguém pegou. */
  atendido: boolean;
  /** A MESMA ficha do funil, pronta (montada no servidor). */
  ficha: FichaLeadDados;
  venda?: {
    site: string | null;
    ramo: string | null;
    segmento: string | null;
    propostaToken: string | null;
  } | null;
};

const CANAL_META: Record<AtendimentoCanal, { label: string; hint: string; bg: string; color: string; Icon: typeof Globe }> = {
  site: {
    label: "Site",
    hint: "Preencheu o formulário do site.",
    bg: "rgba(16,185,129,0.14)",
    color: "#047857",
    Icon: Globe,
  },
  proposta: {
    label: "Proposta",
    hint: "Pediu o orçamento DENTRO da proposta que você mandou — leu a peça e levantou a mão.",
    bg: "rgba(37,99,235,0.14)",
    color: "#1d4ed8",
    Icon: FileText,
  },
  landing: {
    label: "Página de venda",
    hint: "Veio de uma página de segmento ou de anúncio.",
    bg: "rgba(168,85,247,0.14)",
    color: "#7e22ce",
    // Megafone, não faísca: nesta tela a faísca é a AÇÃO da IA (roxo, na linha).
    Icon: Megaphone,
  },
  outro: {
    label: "Contato",
    hint: "Chegou por um canal nosso.",
    bg: "rgba(100,116,139,0.14)",
    color: "#475569",
    Icon: Inbox,
  },
};

/** "hoje 14:32", "ontem", "12/08" — data curta é o que se lê numa caixa. */
function quando(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hoje = new Date();
  const dia = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  const ontem = new Date(hoje.getTime() - 86_400_000);
  if (dia(d) === dia(hoje)) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (dia(d) === dia(ontem)) return "ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function diasAtras(iso: string): number {
  const d = new Date(iso).getTime();
  return Number.isNaN(d) ? 9999 : Math.floor((Date.now() - d) / 86_400_000);
}

export function Atendimentos({
  itens,
  linkFunil,
  acoes,
  onWhats,
  onEmail,
  onIa,
}: {
  itens: AtendimentoItem[];
  /** Pra onde vai o "Trabalhar no funil" (a rota muda de painel pra painel). */
  linkFunil: (item: AtendimentoItem) => string;
  /** Botões extras no rodapé da ficha — cada painel tem os seus. */
  acoes?: (item: AtendimentoItem) => React.ReactNode;
  /** Falar no WhatsApp (só aparece com telefone). O painel abre a conversa DELE. */
  onWhats?: (item: AtendimentoItem) => void;
  /** Responder por e-mail (só com e-mail): abre o compositor da caixa do painel. */
  onEmail?: (item: AtendimentoItem) => void;
  /** Entregar à IA: ela responde e o lead segue no funil (só com e-mail). */
  onIa?: (item: AtendimentoItem) => void;
}) {
  const [busca, setBusca] = useState("");
  const [canal, setCanal] = useState("todos");
  const [situacao, setSituacao] = useState("todos");
  const [aberto, setAberto] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return itens.filter((i) => {
      if (canal !== "todos" && i.canal !== canal) return false;
      if (situacao === "novos" && i.atendido) return false;
      if (situacao === "atendidos" && !i.atendido) return false;
      if (!q) return true;
      return [i.nome, i.empresa, i.email, i.telefone, i.origem, i.assunto, i.mensagem]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [itens, busca, canal, situacao]);

  const item = aberto ? itens.find((i) => i.id === aberto) ?? null : null;

  const colunas: Column<AtendimentoItem>[] = [
    {
      key: "quem",
      header: "Quem",
      render: (i) => (
        <Stack gap={0.5} minW={0}>
          <Text fontSize="sm" fontWeight="700" truncate>
            {i.nome}
          </Text>
          <Text fontSize="xs" color="var(--admin-text-soft)" truncate>
            {[i.empresa, i.email || i.telefone].filter(Boolean).join(" · ") || "sem contato"}
          </Text>
        </Stack>
      ),
    },
    {
      key: "canal",
      header: "Veio de",
      width: "190px",
      render: (i) => {
        const m = CANAL_META[i.canal];
        return (
          <Stack gap={1} minW={0}>
            <Box>
              <Tag bg={m.bg} color={m.color} title={m.hint}>
                <m.Icon size={12} />
                {m.label}
              </Tag>
            </Box>
            {i.origem ? (
              i.origemUrl ? (
                // A peça que ele preencheu abre daqui: numa caixa de atendimento,
                // ler a proposta ANTES de ligar é metade da conversa pronta.
                <chakra.a
                  href={i.origemUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  fontSize="xs"
                  color="var(--admin-primary)"
                  fontWeight="600"
                  display="inline-flex"
                  alignItems="center"
                  gap={1}
                  minW={0}
                >
                  <Text truncate>{i.origem}</Text>
                  <ExternalLink size={11} />
                </chakra.a>
              ) : (
                <Text fontSize="xs" color="var(--admin-text-soft)" truncate>
                  {i.origem}
                </Text>
              )
            ) : null}
          </Stack>
        );
      },
    },
    {
      key: "escreveu",
      header: "O que escreveu",
      hideOnMobile: true,
      render: (i) => (
        <Stack gap={0.5} minW={0}>
          {i.assunto ? (
            <Text fontSize="xs" fontWeight="700" truncate>
              {i.assunto}
            </Text>
          ) : null}
          <Text
            fontSize="xs"
            color="var(--admin-text-soft)"
            lineHeight={1.5}
            css={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {i.mensagem || "—"}
          </Text>
        </Stack>
      ),
    },
    {
      key: "quando",
      header: "Quando",
      width: "96px",
      align: "end",
      render: (i) => (
        <Text fontSize="xs" color="var(--admin-text-soft)" whiteSpace="nowrap">
          {quando(i.quando)}
        </Text>
      ),
    },
    {
      key: "situacao",
      header: "Situação",
      width: "120px",
      render: (i) =>
        i.atendido ? (
          <Tag bg="rgba(100,116,139,0.14)" color="#475569" title="Alguém já pegou este contato.">
            Atendido
          </Tag>
        ) : (
          <Tag bg="rgba(234,179,8,0.18)" color="#b45309" title="Ninguém respondeu ainda.">
            Aguardando
          </Tag>
        ),
    },
  ];

  const semResposta = itens.filter((i) => !i.atendido).length;

  /**
   * As três ações de falar com a pessoa, já resolvidas — a LINHA e a FICHA
   * mostram exatamente as mesmas, e cada uma só existe se o painel passou o
   * callback E a pessoa deixou o contato correspondente.
   */
  const falarCom = (i: AtendimentoItem) => ({
    whats: onWhats && i.telefone ? () => onWhats(i) : null,
    email: onEmail && i.email ? () => onEmail(i) : null,
    ia: onIa && i.email ? () => onIa(i) : null,
  });

  return (
    <Screen
      title="Atendimento"
      count={itens.length}
      subtitle="Quem procurou você — pelo formulário do site ou pelo orçamento dentro da proposta. Responda por aqui; o passo da venda continua no funil."
      filters={
        <FilterBar
          search={busca}
          onSearch={setBusca}
          placeholder="Buscar por nome, empresa, e-mail ou o que escreveu…"
          selects={[
            {
              value: canal,
              onChange: setCanal,
              options: [
                { value: "todos", label: "Todos os canais" },
                { value: "site", label: "Site" },
                { value: "proposta", label: "Proposta" },
                { value: "landing", label: "Página de venda" },
                { value: "outro", label: "Outros" },
              ],
            },
            {
              value: situacao,
              onChange: setSituacao,
              options: [
                { value: "todos", label: "Todas as situações" },
                { value: "novos", label: "Aguardando resposta" },
                { value: "atendidos", label: "Já atendidos" },
              ],
            },
          ]}
        />
      }
    >
      <Stack gap={3}>
        <KpiRow
          items={[
            { label: "Chegaram (7 dias)", value: itens.filter((i) => diasAtras(i.quando) <= 7).length, icon: <MessageSquareText size={14} /> },
            { label: "Aguardando resposta", value: semResposta, tone: semResposta ? "warning" : "success" },
            { label: "Pela proposta", value: itens.filter((i) => i.canal === "proposta").length },
          ]}
        />

        <DataTable
          columns={colunas}
          rows={filtrados}
          getRowKey={(i) => i.id}
          onRowClick={(i) => setAberto(i.id)}
          selectedKey={aberto ?? undefined}
          empty={
            <EmptyState
              icon={MessageSquareText}
              title={itens.length ? "Nada com esse filtro" : "Ninguém procurou você ainda"}
              description={
                itens.length
                  ? "Troque o canal ou a situação para ver o resto."
                  : "Assim que alguém preencher o formulário do site ou pedir o orçamento dentro de uma proposta, o contato aparece aqui — com o que a pessoa escreveu."
              }
            />
          }
          actions={(i) => {
            const a = falarCom(i);
            if (!a.whats && !a.email && !a.ia) return null;
            return (
              <HStack gap={1} justify="flex-end" onClick={(e) => e.stopPropagation()}>
                {a.whats ? (
                  <AcaoIcone
                    tone="whatsapp"
                    title="Chamar no WhatsApp — a conversa abre aqui no painel"
                    ariaLabel="Chamar no WhatsApp"
                    onClick={a.whats}
                  >
                    <MessageCircle size={14} />
                  </AcaoIcone>
                ) : null}
                {a.email ? (
                  <AcaoIcone
                    tone="ligar"
                    title="Responder por e-mail — abre o compositor da caixa já endereçado"
                    ariaLabel="Responder por e-mail"
                    onClick={a.email}
                  >
                    <Mail size={14} />
                  </AcaoIcone>
                ) : null}
                {a.ia ? (
                  <AcaoIcone
                    tone="ia"
                    title="A IA responde e continua no funil por e-mail"
                    ariaLabel="Entregar à IA"
                    onClick={a.ia}
                  >
                    <Sparkles size={14} />
                  </AcaoIcone>
                ) : null}
              </HStack>
            );
          }}
        />
      </Stack>

      {item ? (
        <FichaLead
          open
          onClose={() => setAberto(null)}
          dados={item.ficha}
          footer={(() => {
            // Na ficha as MESMAS três ações ganham legenda: aqui a pessoa está
            // lendo o que o cliente escreveu, e é aqui que ela decide responder.
            const a = falarCom(item);
            return (
              <HStack gap={2} flexWrap="wrap" justify="flex-end">
                {a.whats ? (
                  <Button size="sm" tone="ghost" onClick={a.whats}>
                    <MessageCircle size={14} /> WhatsApp
                  </Button>
                ) : null}
                {a.email ? (
                  <Button size="sm" tone="ghost" onClick={a.email}>
                    <Mail size={14} /> Responder
                  </Button>
                ) : null}
                {a.ia ? (
                  <Button size="sm" tone="ghost" onClick={a.ia}>
                    <Sparkles size={14} /> IA responde
                  </Button>
                ) : null}
                {acoes?.(item)}
                <Button size="sm" asChild>
                  <a href={linkFunil(item)}>Trabalhar no funil</a>
                </Button>
              </HStack>
            );
          })()}
        />
      ) : null}
    </Screen>
  );
}
