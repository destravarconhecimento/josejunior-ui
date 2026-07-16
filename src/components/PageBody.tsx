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
  fill = false,
}: {
  children: ReactNode;
  /** Largura máxima opcional (ex.: formulários estreitos). Default: sem limite
   *  (o <main> do AppShell já dá maxW=1600). */
  maxW?: string;
  /**
   * Ocupa toda a altura livre em vez de crescer com o conteúdo — pra telas
   * "workspace" (e-mail, tabela longa, chat) onde o scroll deve ser INTERNO e
   * não da página. Depende do `flex` column do `<main>` dos shells; quem recebe
   * a altura é o filho direto, então dê a ele `flex="1"` + `minH={0}`.
   * Desligado no mobile de propósito: tela curta, scroll natural da página é
   * melhor que dois scrolls aninhados.
   */
  fill?: boolean;
}) {
  return (
    <Stack
      gap={{ base: 5, md: 6 }}
      maxW={maxW}
      w="full"
      flex={fill ? { md: "1" } : undefined}
      minH={fill ? { md: 0 } : undefined}
    >
      {children}
    </Stack>
  );
}
