"use client";

import { useState } from "react";
import { Box, Flex, HStack, Stack, Text } from "@chakra-ui/react";
import { Monitor, Smartphone } from "lucide-react";
import type { SiteIdentityContent } from "./types";

/**
 * Prévia do SITE INSTITUCIONAL, ao vivo, enquanto o dono edita a marca —
 * mesmo espírito do `RepPreview` dos representantes: NÃO é iframe (iframe
 * mostraria o publicado, não o que está sendo digitado), é uma réplica do
 * hero fiel o bastante pra decidir layout, cor, fonte, logo e fundo.
 *
 * Desenha o hero do layout ESCOLHIDO (`tema.layout`): Obsidian (roxo profundo,
 * OURO nas decisões, CTA cheia) ou Nocturne (lilás delineado). As cores/fontes
 * vêm do `theme` do próprio formulário — vazio cai no padrão de cada layout.
 */

const OBSIDIAN = { bg: "#05030a", accent: "#a855f7", gold: "#ebc875", goldDeep: "#d3a95c" };
const NOCTURNE = { bg: "#0a0710", accent: "#a78bfa" };

function hexOk(v?: string): string | null {
  const t = (v ?? "").trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(t) ? t : null;
}

export function SitePreview({ content }: { content: SiteIdentityContent }) {
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  const c = content;
  const layout = c.tema?.layout ?? "obsidian";
  const obsidian = layout === "obsidian";

  const accent = hexOk(c.theme?.accentColor) ?? (obsidian ? OBSIDIAN.accent : NOCTURNE.accent);
  const bg = hexOk(c.theme?.darkColor) ?? (obsidian ? OBSIDIAN.bg : NOCTURNE.bg);
  const fontHeading = c.theme?.fontHeading?.trim()
    ? `'${c.theme.fontHeading.trim()}', ui-sans-serif, sans-serif`
    : "ui-sans-serif, system-ui, sans-serif";
  const fontBody = c.theme?.fontBody?.trim()
    ? `'${c.theme.fontBody.trim()}', ui-sans-serif, sans-serif`
    : "ui-sans-serif, system-ui, sans-serif";
  // A cor da DECISÃO: ouro no Obsidian, o próprio accent no Nocturne.
  const decisao = obsidian ? OBSIDIAN.gold : accent;

  const logo = c.brand.logo?.trim() || "";
  const fundo = c.hero.image?.trim() || "";
  const titulo = c.operationHero.titleLead || "O que você precisa";
  const destaque = obsidian ? "resolver?" : c.operationHero.rotating[0] || c.operationHero.titleHighlight;

  const largura = mode === "mobile" ? 300 : 400;

  // As famílias escolhidas carregam do Google Fonts SÓ pra prévia — sem isso
  // o mockup cairia no fallback e trocar de fonte pareceria não fazer nada.
  // Mesma validação do site (brand-style.ts): nome inválido é ignorado.
  const familias = [
    ...new Set(
      [c.theme?.fontHeading, c.theme?.fontBody]
        .map((f) => (f ?? "").trim())
        .filter((f) => /^[A-Za-z0-9 ]{2,60}$/.test(f)),
    ),
  ];
  const fontsHref = familias.length
    ? `https://fonts.googleapis.com/css2?${familias
        .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;600;700`)
        .join("&")}&display=swap`
    : null;

  return (
    <Stack gap={3} w={`${largura}px`} transition="width .18s ease">
      {fontsHref ? <link rel="stylesheet" href={fontsHref} /> : null}
      <HStack justify="space-between">
        <Text fontSize="xs" fontWeight="700" color="var(--admin-text-soft)" textTransform="uppercase" letterSpacing="0.06em">
          Prévia — {obsidian ? "Obsidian" : "Nocturne"}
        </Text>
        <HStack gap={1} bg="var(--admin-nav-hover)" borderRadius="8px" p="2px">
          {([["desktop", Monitor], ["mobile", Smartphone]] as const).map(([m, Icon]) => (
            <Box
              key={m}
              as="button"
              onClick={() => setMode(m)}
              px={2}
              py={1}
              borderRadius="6px"
              lineHeight={0}
              cursor="pointer"
              bg={mode === m ? "white" : "transparent"}
              color={mode === m ? "var(--admin-primary)" : "var(--admin-text-soft)"}
              boxShadow={mode === m ? "0 1px 2px rgba(0,0,0,0.12)" : "none"}
              aria-label={m === "desktop" ? "Prévia desktop" : "Prévia celular"}
              aria-pressed={mode === m}
            >
              <Icon size={14} />
            </Box>
          ))}
        </HStack>
      </HStack>

      <Box
        borderRadius="16px"
        overflow="hidden"
        border="1px solid var(--admin-border)"
        boxShadow="0 18px 40px rgba(0,0,0,0.22)"
        bg={bg}
        position="relative"
        fontFamily={fontBody}
      >
        {/* Atmosfera do tema (radiais do accent) + fundo do hero, se houver */}
        <Box
          position="absolute"
          inset={0}
          pointerEvents="none"
          style={{
            background: `radial-gradient(120% 90% at 85% -10%, ${accent}2e, transparent 55%), radial-gradient(90% 70% at 10% 100%, ${accent}14, transparent 60%)`,
          }}
        />
        {fundo ? (
          <Box
            position="absolute"
            inset={0}
            pointerEvents="none"
            style={{
              backgroundImage: `url(${fundo})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              opacity: 0.28,
              maskImage: "linear-gradient(180deg, rgba(0,0,0,0.9), transparent 85%)",
              WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.9), transparent 85%)",
            }}
          />
        ) : null}

        <Stack position="relative" gap={0}>
          {/* Topo: logo + wordmark + CTA */}
          <Flex align="center" justify="space-between" px={4} py={3} borderBottom="1px solid rgba(255,255,255,0.06)">
            <HStack gap={2} minW={0}>
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="logo" style={{ width: 22, height: 22, objectFit: "cover", borderRadius: 6 }} />
              ) : (
                <Box w="22px" h="22px" borderRadius="6px" style={{ background: `${accent}33`, border: `1px solid ${accent}66` }} />
              )}
              <Text fontSize="10px" fontWeight="700" letterSpacing="0.18em" color="rgba(255,255,255,0.92)" fontFamily={fontHeading} truncate>
                {c.brand.wordmark || "SUA MARCA"}
              </Text>
            </HStack>
            <Box
              px={2.5}
              py={1}
              borderRadius="7px"
              fontSize="9px"
              fontWeight="700"
              style={
                obsidian
                  ? { background: `linear-gradient(135deg, ${OBSIDIAN.goldDeep}, ${OBSIDIAN.gold})`, color: "#2b1a05" }
                  : { border: `1px solid ${accent}99`, color: accent }
              }
            >
              Começar
            </Box>
          </Flex>

          {/* Hero */}
          <Stack px={4} pt={5} pb={5} gap={2.5}>
            <Text fontSize="8px" fontWeight="700" letterSpacing="0.2em" textTransform="uppercase" style={{ color: obsidian ? "rgba(255,255,255,0.55)" : accent }}>
              {c.operationHero.eyebrow || "Tecnologia sob medida"}
            </Text>
            <Text fontSize={mode === "mobile" ? "17px" : "21px"} lineHeight="1.15" fontWeight="600" color="rgba(255,255,255,0.96)" fontFamily={fontHeading}>
              {titulo} <Box as="span" style={{ color: decisao }}>{destaque}</Box>
            </Text>
            <Text fontSize="10px" lineHeight="1.55" color="rgba(255,255,255,0.55)">
              {(c.operationHero.subtitle || "").slice(0, 110) || "Subtítulo do topo da home."}
            </Text>

            {obsidian ? (
              <Flex gap={1.5} mt={1} p="4px" borderRadius="10px" border={`1px solid ${accent}42`} bg="rgba(255,255,255,0.03)" align="center">
                <Text flex="1" fontSize="9px" color="rgba(255,255,255,0.35)" px={2} truncate>
                  Ex.: quero automatizar o atendimento…
                </Text>
                <Box px={2.5} py={1.5} borderRadius="7px" fontSize="9px" fontWeight="700" whiteSpace="nowrap" style={{ background: `linear-gradient(135deg, ${OBSIDIAN.goldDeep}, ${OBSIDIAN.gold})`, color: "#2b1a05" }}>
                  Ver possibilidades
                </Box>
              </Flex>
            ) : (
              <HStack gap={2} mt={1}>
                <Box px={3} py={1.5} borderRadius="7px" fontSize="9px" fontWeight="700" style={{ border: `1px solid ${accent}99`, color: accent }}>
                  {c.operationHero.ctaLabel || "Fazer o diagnóstico"}
                </Box>
              </HStack>
            )}

            {/* Chips de contexto */}
            <Flex gap={1.5} flexWrap="wrap" mt={1}>
              {(c.contextDoors.doors ?? []).slice(0, 3).map((d, i) => (
                <Box
                  key={i}
                  px={2}
                  py={1}
                  borderRadius="999px"
                  fontSize="8px"
                  color={i === 0 && obsidian ? decisao : "rgba(255,255,255,0.6)"}
                  style={{ border: i === 0 && obsidian ? `1px solid ${decisao}99` : "1px solid rgba(255,255,255,0.14)" }}
                >
                  {d.label}
                </Box>
              ))}
            </Flex>
          </Stack>
        </Stack>
      </Box>

      <Text fontSize="xs" color="var(--admin-text-soft)">
        Réplica do topo com a marca aplicada — o site publicado usa exatamente estas cores, fontes, logo e fundo.
      </Text>
    </Stack>
  );
}
