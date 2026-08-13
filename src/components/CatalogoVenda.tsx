"use client";

import { useState, type ReactNode } from "react";
import { ExternalLink, Copy, Check, Store, MonitorPlay, BookOpen, Link2 } from "lucide-react";
import { Box, HStack, Stack, Text, chakra } from "@chakra-ui/react";
import { Button } from "./Button";
import { Card } from "./Card";
import { InsightCard } from "./InsightCard";
import { Tag } from "./Badge";
import type { CatalogoItem } from "../catalogo";

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
 * CATÁLOGO DE VENDA — a lista única do que se manda pro cliente, IGUAL nos dois
 * painéis: o do representante (`/painel/catalogo`) e o do sistema (Segmentos →
 * "Catálogo de venda"), onde trabalha quem vende direto com o José.
 *
 * Cada card é um segmento com o SEU link. Os que já têm o site de demonstração no
 * ar abrem nas quatro línguas (o seletor fica no topo do site) e trazem o roteiro
 * de apresentação. Os itens vêm prontos de `montarCatalogo` — o componente não
 * sabe de domínio nem de atribuição.
 */
export function CatalogoVenda({
  itens = [],
  material,
  materialLinks,
  customDomain = "",
  nota,
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

                {it.modulos.length ? (
                  <HStack gap={1.5} flexWrap="wrap">
                    {it.modulos.slice(0, 6).map((m) => (
                      <Tag key={m} bg="rgba(34,197,94,0.12)" color="#15803d">{m}</Tag>
                    ))}
                  </HStack>
                ) : null}

                <CopyLink value={it.link} />

                {it.idiomas ? (
                  <HStack gap={1.5} flexWrap="wrap" align="center">
                    <Text fontSize="xs" color="var(--admin-text-soft)">Abre em:</Text>
                    {it.idiomas.map((i) => (
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

                <Box mt="auto">
                  <HStack gap={2} flexWrap="wrap">
                    <Button tone="primary" size="sm" asChild>
                      <a href={it.link} target="_blank" rel="noopener">
                        <ExternalLink size={14} style={{ marginRight: 6 }} /> Abrir página
                      </a>
                    </Button>
                    {it.apresentacao ? (
                      <Button tone="outline" size="sm" asChild>
                        <a href={it.apresentacao} target="_blank" rel="noopener">
                          <BookOpen size={14} style={{ marginRight: 6 }} /> Como apresentar
                        </a>
                      </Button>
                    ) : null}
                  </HStack>
                </Box>
              </Stack>
            </Card>
          ))}
        </Box>
      )}
    </>
  );
}
