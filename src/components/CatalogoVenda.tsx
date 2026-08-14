"use client";

import { useState, type ReactNode } from "react";
import { ExternalLink, Copy, Check, Store, MonitorPlay, BookOpen, Link2, KeyRound } from "lucide-react";
import { Box, HStack, Stack, Text, chakra } from "@chakra-ui/react";
import { Button } from "./Button";
import { Card } from "./Card";
import { InsightCard } from "./InsightCard";
import { Tag } from "./Badge";
import type { CatalogoItem, CatalogoDemo } from "../catalogo";

/** Campo com o link + botão de copiar (padrão das landings do rep). */
function CopyLink({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <HStack gap={2} align="stretch">
      <Box
        flex="1"
        minW={0}
        px={3}
        py={2}
        borderRadius="10px"
        bg="var(--admin-surface-2)"
        borderWidth="1px"
        borderColor="var(--admin-border)"
        fontSize="xs"
        fontFamily="monospace"
        color="var(--admin-text)"
        overflowX="auto"
        whiteSpace="nowrap"
      >
        {value}
      </Box>
      <Button tone={copied ? "primary" : "outline"} size="sm" onClick={copy}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copiado" : "Copiar"}
      </Button>
    </HStack>
  );
}

/**
 * O LINK DE VENDA de um segmento: o endereço que se manda pro cliente, as línguas
 * em que ele abre e o roteiro de apresentação.
 *
 * É componente à parte porque a MESMA coisa aparece em dois lugares: no card da
 * lista (aqui embaixo) e DENTRO do segmento, no detalhe do painel do José. Enquanto
 * isso só existia no card, quem abria um segmento não achava o link que ia mandar —
 * tinha de voltar pra lista pra copiar.
 */
export function LinkDeVenda({
  link,
  idiomas,
  apresentacao,
  aviso,
}: {
  /** Endereço público. Vazio = não há página no ar (mostra o `aviso`). */
  link: string;
  idiomas?: { code: string; label: string; url: string }[];
  apresentacao?: string;
  /** O que dizer quando não há link. */
  aviso?: ReactNode;
}) {
  if (!link) {
    return aviso ? (
      <Text fontSize="xs" color="var(--admin-text-soft)">
        {aviso}
      </Text>
    ) : null;
  }
  return (
    <Stack gap={2.5}>
      <CopyLink value={link} />

      {idiomas?.length ? (
        <HStack gap={1.5} flexWrap="wrap" align="center">
          <Text fontSize="xs" color="var(--admin-text-soft)">Abre em:</Text>
          {idiomas.map((i) => (
            <chakra.a
              key={i.code}
              href={i.url}
              target="_blank"
              rel="noopener"
              px={2}
              py="2px"
              borderRadius="999px"
              borderWidth="1px"
              borderColor="var(--admin-border)"
              fontSize="xs"
              fontWeight="600"
              color="var(--admin-text-soft)"
              _hover={{ bg: "var(--admin-surface-2)", color: "var(--admin-text)" }}
            >
              {i.label}
            </chakra.a>
          ))}
          <Text fontSize="xs" color="var(--admin-text-soft)">
            (é o mesmo link — o seletor fica no topo do site)
          </Text>
        </HStack>
      ) : null}

      <HStack gap={2} flexWrap="wrap">
        <Button tone="primary" size="sm" asChild>
          <a href={link} target="_blank" rel="noopener">
            <ExternalLink size={14} style={{ marginRight: 6 }} /> Abrir página
          </a>
        </Button>
        {apresentacao ? (
          <Button tone="outline" size="sm" asChild>
            <a href={apresentacao} target="_blank" rel="noopener">
              <BookOpen size={14} style={{ marginRight: 6 }} /> Como apresentar
            </a>
          </Button>
        ) : null}
      </HStack>
    </Stack>
  );
}

/** Uma credencial do demo: e-mail e senha lado a lado, copiáveis um a um. */
function ParDeAcesso({ rotulo, email, senha }: { rotulo: string; email: string; senha: string }) {
  return (
    <Stack gap={1}>
      <Text fontSize="xs" fontWeight="700" color="var(--admin-text)">
        {rotulo}
      </Text>
      <CopyLink value={email} />
      <CopyLink value={senha} />
    </Stack>
  );
}

/**
 * ENTRAR NO DEMO — o sistema por dentro, com os dois logins.
 *
 * Fica no MESMO card do link de venda porque é a segunda metade da apresentação:
 * o link mostra o site que o cliente vai ter, o demo mostra o painel em que ele
 * vai trabalhar. Quem apresenta não deveria ter de procurar a senha em outro
 * lugar — nem pedir ao José, que era o que acontecia.
 *
 * A senha aparece em texto de propósito: é credencial de test-drive, igual pra
 * todo mundo, num tenant que se limpa sozinho todo dia.
 */
export function AcessoDemo({ demo }: { demo: CatalogoDemo }) {
  return (
    <Box
      borderTopWidth="1px"
      borderColor="var(--admin-border)"
      pt={3}
      mt={1}
    >
      <Stack gap={2.5}>
        <HStack gap={2} align="center">
          <Box color="var(--admin-accent)" display="flex">
            <KeyRound size={14} />
          </Box>
          <Text fontSize="xs" fontWeight="700" color="var(--admin-text)">
            Ver por dentro (demo)
          </Text>
        </HStack>
        <Text fontSize="xs" color="var(--admin-text-soft)">
          O sistema de verdade, com dados de exemplo. Pode mexer à vontade: o demo se
          refaz sozinho todo dia.
        </Text>
        <Button tone="outline" size="sm" asChild>
          <a href={demo.loginUrl} target="_blank" rel="noopener">
            <ExternalLink size={14} style={{ marginRight: 6 }} /> Abrir o demo
          </a>
        </Button>
        <ParDeAcesso rotulo="Admin (dono do negócio)" email={demo.adminEmail} senha={demo.adminSenha} />
        <ParDeAcesso rotulo={demo.userRotulo} email={demo.userEmail} senha={demo.userSenha} />
      </Stack>
    </Box>
  );
}

/**
 * CATÁLOGO DE VENDA — a lista única dos SEGMENTOS, IGUAL nos dois painéis: o do
 * representante (`/painel/catalogo`) e o do sistema (Segmentos & Catálogo), onde
 * trabalha quem vende direto com o José.
 *
 * Cada card é um segmento com o SEU link. Os que já têm o site no ar abrem nas
 * quatro línguas (o seletor fica no topo do site) e trazem o roteiro de
 * apresentação. Os itens vêm prontos de `montarCatalogo` — o componente não sabe
 * de domínio nem de atribuição.
 *
 * No painel do José o MESMO card carrega a configuração do segmento: os fatos vêm
 * em `item.meta` e os botões de abrir/excluir em `acoes`. Antes eram duas abas
 * sobre a mesma lista ("Configuração" × "Catálogo de venda") — o segmento parecia
 * duas coisas diferentes e o link de venda não existia dentro dele.
 */
export function CatalogoVenda({
  itens = [],
  material,
  materialLinks,
  customDomain = "",
  nota,
  acoes,
}: {
  itens?: CatalogoItem[];
  /** `/apresentar` — o material que ensina a apresentar. */
  material: string;
  /** `/apresentar/links` — a página que explica os links (pra ler antes de mandar). */
  materialLinks: string;
  /** Domínio próprio do rep (sem www): só pra dizer onde o material abre na marca dele. */
  customDomain?: string;
  /** Linha de contexto do painel (o público de cada um é diferente). */
  nota?: ReactNode;
  /** Ações de quem ADMINISTRA o segmento (abrir/excluir). Vazio no painel do rep. */
  acoes?: (item: CatalogoItem) => ReactNode;
}) {
  return (
    <>
      <InsightCard title="Comece por aqui: aprenda a apresentar" icon={<BookOpen size={16} />} tone="primary">
        <Stack gap={2} align="flex-start">
          <Text fontSize="sm" color="var(--admin-text)">
            Abra o material de vendas: ele ensina <strong>como apresentar</strong> — os degraus
            da venda, o que mostrar em cada tela, as perguntas que decidem a conversa, as
            objeções e mensagens prontas pra copiar. Depois é só mandar o link do segmento
            aqui de baixo.
          </Text>
          <HStack gap={2} flexWrap="wrap">
            <Button tone="primary" size="sm" asChild>
              <a href={material} target="_blank" rel="noopener">
                Como apresentar <ExternalLink size={14} style={{ marginLeft: 6 }} />
              </a>
            </Button>
            <Button tone="outline" size="sm" asChild>
              <a href={materialLinks} target="_blank" rel="noopener">
                <Link2 size={14} style={{ marginRight: 6 }} /> Os links explicados
              </a>
            </Button>
          </HStack>
          {customDomain ? (
            <Text fontSize="xs" color="var(--admin-text-soft)">
              Na sua marca: <strong>apresentacao.{customDomain}</strong> abre este material e{" "}
              <strong>apresentacao.{customDomain}/links</strong> abre a página dos seus links.
            </Text>
          ) : null}
        </Stack>
      </InsightCard>

      {nota ? (
        <Card>
          <Text fontSize="sm" color="var(--admin-text-soft)">
            {nota}
          </Text>
        </Card>
      ) : null}

      {itens.length === 0 ? (
        <Card>
          <Text fontSize="sm" color="var(--admin-text-soft)">
            Nenhum segmento disponível no momento.
          </Text>
        </Card>
      ) : (
        <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
          {itens.map((it) => (
            <Card key={it.id}>
              <Stack gap={3} h="full">
                <HStack gap={2} align="center">
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    w="34px"
                    h="34px"
                    borderRadius="10px"
                    bg="var(--admin-accent-soft, var(--admin-surface-2))"
                    color={it.cor || "var(--admin-accent)"}
                    flexShrink={0}
                  >
                    {it.idiomas ? <MonitorPlay size={18} /> : <Store size={18} />}
                  </Box>
                  <Box minW={0}>
                    <Text fontWeight="700" color="var(--admin-text)" lineClamp={1}>
                      {it.nome}
                    </Text>
                    <Text fontSize="xs" color="var(--admin-text-soft)" lineClamp={1}>
                      {it.badge}
                    </Text>
                  </Box>
                </HStack>

                <Text fontSize="sm" color="var(--admin-text-soft)" lineClamp={3}>
                  {it.subtitle}
                </Text>

                {it.meta?.length ? (
                  <HStack gap={2} flexWrap="wrap" fontSize="xs" color="var(--admin-text-soft)">
                    {it.meta.map((m, i) => (
                      <Text key={m}>{i ? `· ${m}` : m}</Text>
                    ))}
                  </HStack>
                ) : null}

                {it.modulos.length ? (
                  <HStack gap={1.5} flexWrap="wrap">
                    {it.modulos.slice(0, 6).map((m) => (
                      <Tag key={m} bg="rgba(34,197,94,0.12)" color="#15803d">{m}</Tag>
                    ))}
                  </HStack>
                ) : null}

                <Box mt="auto">
                  <Stack gap={3}>
                    <LinkDeVenda
                      link={it.link}
                      idiomas={it.idiomas}
                      apresentacao={it.apresentacao}
                      aviso={it.aviso}
                    />
                    {it.demo ? <AcessoDemo demo={it.demo} /> : null}
                    {acoes ? <HStack gap={2} flexWrap="wrap">{acoes(it)}</HStack> : null}
                  </Stack>
                </Box>
              </Stack>
            </Card>
          ))}
        </Box>
      )}
    </>
  );
}
