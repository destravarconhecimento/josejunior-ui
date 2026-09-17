"use client";

import type { ReactNode } from "react";
import { Box, Flex, Image, SimpleGrid } from "../primitives";

/**
 * Grade de FOTOS selecionáveis — escolher a capa, marcar quais vão para o
 * anúncio, ver o que foi enviado. A moldura muda com `selecionada` (borda de
 * 2px na cor do painel), e o clique da linha de baixo (`direita`) não vaza para
 * o clique da foto: `stopPropagation` no rodapé, senão marcar a foto e apagar a
 * foto viram o mesmo gesto.
 */
export type FotoDaGrade = {
  chave: string;
  url: string;
  alt: string;
  selecionada?: boolean;
  /** Canto superior esquerdo: número da ordem, selo "capa", cadeado. */
  marcador?: ReactNode;
  legenda?: ReactNode;
  /** Ações da foto no rodapé do card (apagar, girar) — não disparam o clique. */
  direita?: ReactNode;
  aoClicar?: () => void;
  testId?: string;
};

export function GradeDeFotos({
  fotos,
  colunas = { base: 2, md: 4, lg: 6 },
}: {
  fotos: FotoDaGrade[];
  colunas?: { base: number; md?: number; lg?: number };
}) {
  return (
    <SimpleGrid columns={colunas} gap="3">
      {fotos.map((f) => (
        <Box
          key={f.chave}
          borderWidth={f.selecionada ? "2px" : "1px"}
          borderColor={f.selecionada ? "var(--admin-primary)" : "border"}
          rounded="md"
          overflow="hidden"
          position="relative"
          cursor={f.aoClicar ? "pointer" : undefined}
          onClick={f.aoClicar}
          data-testid={f.testId}
        >
          <Image src={f.url} alt={f.alt} aspectRatio={1} objectFit="contain" bg="bg.muted" />
          {f.marcador ? (
            <Box position="absolute" top="1" left="1">
              {f.marcador}
            </Box>
          ) : null}
          {(f.legenda || f.direita) && (
            <Flex justify="space-between" align="center" px="2" py="1" gap="1">
              <Box minW="0">{f.legenda}</Box>
              {f.direita ? (
                <Flex gap="1" align="center" flexShrink="0" onClick={(e) => e.stopPropagation()}>
                  {f.direita}
                </Flex>
              ) : null}
            </Flex>
          )}
        </Box>
      ))}
    </SimpleGrid>
  );
}
