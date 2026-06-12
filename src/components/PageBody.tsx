import type { ReactNode } from "react";
import { Stack } from "@chakra-ui/react";

/**
 * Corpo PADRÃO de toda tela logada: empilha as seções com um ritmo vertical
 * único (gap fixo). A tela NÃO define mais gap/margem entre seções — só compõe
 * <Card>/<TableCard>/<SimpleGrid> aqui dentro. Garante homogeneidade.
 */
export function PageBody({
  children,
  maxW,
}: {
  children: ReactNode;
  /** Largura máxima opcional (ex.: formulários estreitos). Default: sem limite
   *  (o <main> do AppShell já dá maxW=1600). */
  maxW?: string;
}) {
  return (
    <Stack gap={{ base: 5, md: 6 }} maxW={maxW} w="full">
      {children}
    </Stack>
  );
}
