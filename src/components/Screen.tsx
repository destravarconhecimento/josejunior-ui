import type { ReactNode } from "react";
import { Flex } from "@chakra-ui/react";
import { PageHeader } from "./PageHeader";
import { PageBody } from "./PageBody";

export function Screen({
  title,
  rawTitle,
  titleAfter,
  subtitle,
  count,
  filters,
  actions,
  tabs,
  kpis,
  blocos,
  children,
  maxW,
  fill = false,
}: {
  title: string;
  rawTitle?: boolean;
  titleAfter?: ReactNode;
  subtitle?: ReactNode;
  count?: number | string;
  /** @deprecated a busca/filtro pertence à tabela (`busca`/`filtrosDaTela` da
   *  `DataTable`), que já os desenha colados no topo dela. Mantido para as telas
   *  que ainda não migraram. */
  filters?: ReactNode;
  actions?: ReactNode;
  tabs?: ReactNode;
  /** Faixa de indicadores — só `KpiRow`, no máximo uma por tela. */
  kpis?: ReactNode;
  /** Blocos próprios da tela, entre o cabeçalho e o conteúdo principal. */
  blocos?: ReactNode;
  /** Opcional: tela cujo conteúdo inteiro mora em `tabs`/`blocos` não tem corpo. */
  children?: ReactNode;
  maxW?: string;
  fill?: boolean;
}) {
  return (
    <Flex
      direction="column"
      flex={fill ? { md: "1" } : undefined}
      minH={fill ? { md: 0 } : undefined}
      h={fill ? { md: "var(--admin-content-h, calc(100dvh - 132px))" } : undefined}
      maxH={fill ? { md: "var(--admin-content-h, calc(100dvh - 132px))" } : undefined}
      css={
        fill
          ? {
              '&:has([data-jj-table="pagina"])': {
                height: "auto",
                maxHeight: "none",
                flex: "none",
              },
            }
          : undefined
      }
    >
      <PageHeader
        title={title}
        rawTitle={rawTitle}
        titleAfter={titleAfter}
        subtitle={subtitle}
        count={count}
        filters={filters}
        actions={actions}
        tabs={tabs}
        kpis={kpis}
      />
      <PageBody maxW={maxW} fill={fill}>
        {blocos}
        {children}
      </PageBody>
    </Flex>
  );
}
