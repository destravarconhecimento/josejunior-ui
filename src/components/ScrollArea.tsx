import type { ReactNode } from "react";
import { Box } from "@chakra-ui/react";

/**
 * Painel que ROLA dentro da área visível — o miolo de uma aba de conteúdo
 * MISTO (KPIs, cards, gráficos, formulário) dentro de uma `Screen fill`.
 *
 * Como filho direto do `PageBody fill` ele herda a altura que o shell publicou
 * (`--admin-content-h`) e rola INTERNAMENTE: a página nunca mexe e o
 * header/abas ficam fixos. É o que fecha o buraco das telas tabbed mistas — sem
 * ele, um `<Stack>` de cards cru dentro do `PageBody fill` (que não tem
 * `overflow`) seria CORTADO, o que é pior que rolar a página.
 *
 * NÃO use numa aba que é só uma `<DataTable>`: a table já enche e tem scroll
 * próprio (cabeçalho fixo). ScrollArea é pro que NÃO é table.
 *
 * Mobile: block natural (scroll de página). Dois scrolls aninhados em tela
 * curta é pior — mesma regra do `Screen fill`/`PageBody fill`.
 */
export function ScrollArea({ children }: { children: ReactNode }) {
  return (
    <Box
      flex={{ md: "1" }}
      minH={{ md: 0 }}
      overflowY={{ md: "auto" }}
      // reserva o vão da barra de rolagem pra não empurrar o conteúdo ao aparecer
      css={{ scrollbarGutter: "stable" }}
    >
      {children}
    </Box>
  );
}
