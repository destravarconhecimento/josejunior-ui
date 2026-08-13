"use client";

import type { ReactNode } from "react";
import { Box, chakra, HStack, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { FileText, MonitorSmartphone } from "lucide-react";
import { Modal } from "./Modal";
import { Tag } from "./Badge";
import { InlineSelect } from "./InlineSelect";
import { TextoCopiavel } from "./TextoCopiavel";
import { NumeroWhats, type SituacaoWhats } from "./NumeroWhats";

/**
 * A FICHA DO LEAD — "quem é essa pessoa e o que já rolou com ela", numa tela só.
 *
 * É a MESMA ficha nos dois painéis (José e representante): o representante já
 * tinha uma, o sistema não tinha nenhuma, e escrever a segunda seria garantir
 * que as duas divergissem no primeiro ajuste. Componente PURO — dados e
 * callbacks por props, ações no rodapé por conta de quem chama (molde do
 * `MailClient`): a condição do lead, o próximo passo, o contato, a PEÇA
 * (proposta e a demo antiga), os e-mails que saíram e o diário.
 *
 * Cada bloco só aparece se tiver dado. Painel de vendedor mostra menos que o do
 * José porque ele SABE menos — não porque a ficha é outra.
 */

/** Uma condição possível do lead (o vocabulário é de quem chama). */
export type FichaEtapaOpcao = {
  value: string;
  label: string;
  /** A frase que explica a condição — some se não vier. */
  hint?: string;
  bg?: string;
  color?: string;
};

/** Um e-mail que saiu pra esse lead. */
export type FichaEmail = {
  campanha: string | null;
  /** ISO. */
  enviadoEm: string;
  abriuEm: string | null;
  clicouEm: string | null;
  status: string;
};

/** Um link de venda desse lead (a proposta, ou a demo antiga). */
export type FichaPeca = {
  url: string;
  /** A segunda face (o site de exemplo) — null quando a peça não tem. */
  urlSite?: string | null;
  /** O que essa peça é ("Proposta · Clínica", "Demo antiga"). */
  rotulo: string;
  views: number;
  viewsSite?: number;
  /** ISO da última abertura — null = nunca abriram. */
  abertaEm?: string | null;
};

export type FichaLeadDados = {
  nome: string | null;
  empresa?: string | null;
  cidade?: string | null;
  email?: string | null;
  /** O número como se lê (formatado). */
  telefone?: string | null;
  /** O que se sabe do número — o selo ao lado dele. */
  whats?: SituacaoWhats;
  /** O site da empresa, quando a ficha conhece um. */
  site?: string | null;
  /** Condição atual (tem que casar com um `value` de `etapas`). */
  etapa?: string | null;
  proximaAcao?: string | null;
  /** ISO. */
  proximaAcaoEm?: string | null;
  /**
   * O que ELE escreveu ao procurar você (assunto + mensagem do formulário). Só
   * existe em quem chegou sozinho — base fria não escreveu nada. É o bloco que
   * veio da tela de Atendimentos: sem ele, aposentá-la perderia o pedido em si,
   * que é a única coisa do contato que não dá pra deduzir do resto da ficha.
   */
  pedido?: { assunto?: string | null; texto?: string | null } | null;
  /** Diário do lead, mais recente primeiro. */
  notas?: string[];
  emails?: FichaEmail[];
  proposta?: FichaPeca | null;
  /** A demo ANTIGA, quando o lead ainda tem uma (nada nasce mais lá). */
  demo?: FichaPeca | null;
  /** Frases de contexto que só um painel sabe (ex.: "ainda no automático"). */
  avisos?: string[];
};

function fmtDia(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

const ROTULO_BLOCO = {
  fontSize: "xs",
  fontWeight: "700",
  color: "var(--admin-text-soft)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

/** O link de venda + o que se sabe da leitura dele. */
function LinhaPeca({ peca }: { peca: FichaPeca }) {
  const abriu = peca.views > 0 || (peca.viewsSite ?? 0) > 0;
  return (
    <Stack gap={0.5} minW={0}>
      <HStack gap={2} flexWrap="wrap">
        <Box as="span" color="var(--admin-text-soft)" display="inline-flex" flexShrink={0}>
          <FileText size={13} />
        </Box>
        <Text fontSize="xs" color="var(--admin-text-soft)">
          {peca.rotulo}
        </Text>
        {/* Abertura é o único sinal honesto de interesse antes da resposta: quem
            abriu duas vezes merece ligação hoje, e isso tem que estar escrito. */}
        <Tag
          bg={abriu ? "rgba(34,197,94,0.12)" : "rgba(100,116,139,0.12)"}
          color={abriu ? "#15803d" : "var(--admin-text-soft)"}
        >
          {abriu
            ? `abriu ${peca.views}×${(peca.viewsSite ?? 0) > 0 ? ` · site ${peca.viewsSite}×` : ""}`
            : "não abriu"}
        </Tag>
        {peca.abertaEm ? (
          <Text fontSize="xs" color="var(--admin-text-soft)">
            último acesso {fmtDia(peca.abertaEm)}
          </Text>
        ) : null}
      </HStack>
      <HStack gap={3} flexWrap="wrap">
        <chakra.a
          href={peca.url}
          target="_blank"
          rel="noreferrer"
          fontSize="sm"
          color="var(--admin-primary)"
          textDecoration="underline"
          lineClamp={1}
          minW={0}
        >
          {peca.url}
        </chakra.a>
        {peca.urlSite ? (
          <chakra.a
            href={peca.urlSite}
            target="_blank"
            rel="noreferrer"
            fontSize="xs"
            color="var(--admin-text-soft)"
            display="inline-flex"
            alignItems="center"
            gap={1}
            flexShrink={0}
          >
            <MonitorSmartphone size={12} /> ver o site de exemplo
          </chakra.a>
        ) : null}
      </HStack>
    </Stack>
  );
}

export function FichaLead({
  open,
  onClose,
  dados,
  etapas = [],
  onEtapa,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  dados: FichaLeadDados;
  /** Vazio (ou sem `onEtapa`) = a ficha só LÊ a condição. */
  etapas?: FichaEtapaOpcao[];
  onEtapa?: (valor: string) => void;
  /** Os botões de agir — cada painel tem os seus. */
  footer?: ReactNode;
}) {
  const etapaAtual = etapas.find((e) => e.value === (dados.etapa ?? "")) ?? etapas[0];
  const notas = dados.notas ?? [];
  const emails = dados.emails ?? [];
  const avisos = dados.avisos ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={dados.nome || dados.empresa || dados.email || "Contato"}
      footer={footer}
    >
      {etapas.length && etapaAtual ? (
        <HStack gap={3} flexWrap="wrap" align="center">
          <Text fontSize="sm" fontWeight="600" color="var(--admin-text-soft)">
            Condição
          </Text>
          {/* Sem `onEtapa` a ficha só LÊ: o painel que não deixa mover a etapa
              mostra o mesmo selo, sem virar um controle que não faz nada. */}
          {onEtapa ? (
            <InlineSelect
              value={etapaAtual.value}
              options={etapas.map((e) => ({ value: e.value, label: e.label }))}
              onChange={onEtapa}
              render={(v) => {
                const m = etapas.find((e) => e.value === v) ?? etapaAtual;
                return (
                  <Tag bg={m.bg ?? "rgba(100,116,139,0.14)"} color={m.color ?? "#475569"}>
                    {m.label}
                  </Tag>
                );
              }}
            />
          ) : (
            <Tag
              bg={etapaAtual.bg ?? "rgba(100,116,139,0.14)"}
              color={etapaAtual.color ?? "#475569"}
            >
              {etapaAtual.label}
            </Tag>
          )}
          {etapaAtual.hint ? (
            <Text fontSize="xs" color="var(--admin-text-soft)">
              {etapaAtual.hint}
            </Text>
          ) : null}
        </HStack>
      ) : null}

      {/* Sempre visível, mesmo (principalmente) vazio: a borda vermelha do "nada
          marcado" é o ponto da ficha — contato sem próximo passo é contato que
          morre, e esconder o vazio esconderia justamente o problema. */}
      <Box
        className="admin-card"
        p={3}
        bg="var(--admin-nav-hover)"
        borderLeftWidth="3px"
        borderColor={dados.proximaAcaoEm ? "var(--admin-primary)" : "#b91c1c"}
      >
        <Text {...ROTULO_BLOCO} mb={1}>
          Próximo passo
        </Text>
        {dados.proximaAcaoEm || dados.proximaAcao ? (
          <Text fontSize="sm" color="var(--admin-text)">
            {dados.proximaAcao || "—"}
            {dados.proximaAcaoEm ? <b> · {fmtDia(dados.proximaAcaoEm)}</b> : null}
          </Text>
        ) : (
          <Text fontSize="sm" color="var(--admin-text)">
            Nada marcado. Enquanto não tiver um próximo passo com data, este contato depende da sua
            memória.
          </Text>
        )}
      </Box>

      {/* O pedido vem ANTES do contato de propósito: quando a pessoa escreveu
          alguma coisa, é ela que decide o que responder — o telefone só importa
          depois de saber o que ela quer. */}
      {dados.pedido && (dados.pedido.assunto || dados.pedido.texto) ? (
        <Box className="admin-card" p={3} maxH="220px" overflowY="auto">
          <Text {...ROTULO_BLOCO} mb={1}>
            O que ele escreveu
          </Text>
          {dados.pedido.assunto ? (
            <Text fontSize="sm" fontWeight="600" color="var(--admin-text)" mb={1}>
              {dados.pedido.assunto}
            </Text>
          ) : null}
          {dados.pedido.texto ? (
            <Text fontSize="sm" color="var(--admin-text)" whiteSpace="pre-wrap">
              {dados.pedido.texto}
            </Text>
          ) : null}
        </Box>
      ) : null}

      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
        <Stack gap={0.5} minW={0}>
          <Text {...ROTULO_BLOCO}>Contato</Text>
          {/* Mesma regra da lista: clicar copia, e o número diz se tem WhatsApp. */}
          <TextoCopiavel texto={dados.email || null} rotulo="E-mail copiado" vazio="sem e-mail" />
          <NumeroWhats numero={dados.telefone || null} situacao={dados.whats ?? "?"} />
        </Stack>
        <Stack gap={0.5} minW={0}>
          <Text {...ROTULO_BLOCO}>Empresa · Cidade</Text>
          <Text fontSize="sm" color="var(--admin-text)">
            {[dados.empresa, dados.cidade].filter(Boolean).join(" · ") || "—"}
          </Text>
          {dados.site ? (
            <chakra.a
              href={dados.site.startsWith("http") ? dados.site : `https://${dados.site}`}
              target="_blank"
              rel="noreferrer"
              fontSize="xs"
              color="var(--admin-text-soft)"
              lineClamp={1}
            >
              {dados.site}
            </chakra.a>
          ) : null}
        </Stack>
      </SimpleGrid>

      {dados.proposta || dados.demo ? (
        <Box className="admin-card" p={3}>
          <Text {...ROTULO_BLOCO} mb={2}>
            O que essa pessoa recebeu pra ver
          </Text>
          <Stack gap={2.5}>
            {dados.proposta ? <LinhaPeca peca={dados.proposta} /> : null}
            {dados.demo ? <LinhaPeca peca={dados.demo} /> : null}
          </Stack>
        </Box>
      ) : null}

      {emails.length ? (
        <Box className="admin-card" p={3} maxH="220px" overflowY="auto">
          <Text {...ROTULO_BLOCO} mb={1.5}>
            E-mails que saíram
          </Text>
          <Stack gap={1}>
            {emails.slice(0, 12).map((e, i) => (
              <HStack key={i} gap={2} flexWrap="wrap">
                <Text fontSize="xs" color="var(--admin-text-soft)">
                  {fmtDia(e.enviadoEm)}
                </Text>
                <Text fontSize="xs" color="var(--admin-text)" lineClamp={1} minW={0}>
                  {e.campanha ?? "campanha"}
                </Text>
                <Text
                  fontSize="xs"
                  color={e.clicouEm ? "#1d4ed8" : e.abriuEm ? "#15803d" : "var(--admin-text-soft)"}
                >
                  {e.clicouEm ? "clicou" : e.abriuEm ? "abriu" : e.status}
                </Text>
              </HStack>
            ))}
          </Stack>
        </Box>
      ) : null}

      {avisos.map((a, i) => (
        <Text key={i} fontSize="xs" color="var(--admin-text-soft)">
          {a}
        </Text>
      ))}

      {notas.length ? (
        <Box className="admin-card" p={3} maxH="220px" overflowY="auto">
          <Text {...ROTULO_BLOCO} mb={1.5}>
            Histórico
          </Text>
          <Stack gap={1}>
            {notas.map((n, i) => (
              <Text key={i} fontSize="sm" color="var(--admin-text)" whiteSpace="pre-wrap">
                {n}
              </Text>
            ))}
          </Stack>
        </Box>
      ) : null}
    </Modal>
  );
}
