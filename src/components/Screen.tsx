import type { ReactNode } from "react";
import { Flex } from "@chakra-ui/react";
import { PageHeader } from "./PageHeader";
import { PageBody } from "./PageBody";

/**
 * MOLDURA ÚNICA de toda tela logada — header + corpo numa peça só.
 *
 * Existe porque `PageHeader` + `PageBody` estavam sendo colados à mão em ~110
 * telas, e o resultado foi previsível: o `sistema` acabou com uma moldura
 * PRÓPRIA (header + filho solto, sem `PageBody` em 41 das 44 telas), o portal
 * inventou o ritmo dele, e o `fill` não era usado por ninguém. Uma tela agora é:
 *
 *   <Screen title="Clientes" count={rows.length} filters={...} actions={...}>
 *     <ClientesTable ... />
 *   </Screen>
 *
 * Não há mais onde errar o espaçamento: a tela não define gap/margem/maxW.
 *
 * FUNCIONA IGUAL NOS DOIS SHELLS de propósito. `AppShell` (sidebar) e
 * `TopBarShell` (topbar) publicam o MESMO contrato — `--admin-content-h` e um
 * `<main>` flex em coluna — e os dois já descontam a `BottomNav` (78px +
 * safe-area) da conta. Então `fill` não precisa saber onde está nem se o dock
 * existe: ele só ocupa a altura que o shell publicou.
 */
export function Screen({
  title,
  subtitle,
  count,
  filters,
  actions,
  tabs,
  children,
  maxW,
  fill = false,
}: {
  title: string;
  /** Linha de apoio sob o título. */
  subtitle?: ReactNode;
  /** Contador colado no título (ex.: total da tabela). 0 e undefined somem. */
  count?: number | string;
  /** Busca/filtros da tela (normalmente um `FilterBar` — já vai `attached`). */
  filters?: ReactNode;
  actions?: ReactNode;
  tabs?: ReactNode;
  children: ReactNode;
  /** Largura máxima do corpo (ex.: "680px" em formulários estreitos). */
  maxW?: string;
  /**
   * Corpo ocupa a altura livre em vez de crescer com o conteúdo — pra telas
   * "workspace" (tabela longa, e-mail, chat, kanban) onde o scroll deve ser
   * INTERNO. Quem recebe a altura é o filho direto: dê a ele `flex="1"` e
   * `minH={0}`. Desligado no mobile de propósito (tela curta: scroll de página
   * é melhor que dois scrolls aninhados).
   */
  fill?: boolean;
}) {
  return (
    <Flex direction="column" flex={fill ? { md: "1" } : undefined} minH={fill ? { md: 0 } : undefined}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        count={count}
        filters={filters}
        actions={actions}
        tabs={tabs}
      />
      <PageBody maxW={maxW} fill={fill}>
        {children}
      </PageBody>
    </Flex>
  );
}
