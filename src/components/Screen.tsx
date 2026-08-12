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
  titleAfter,
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
  /** Controle colado ao título, na MESMA linha (ex.: seletor de contas do e-mail/
   *  redes sociais). Repassado ao `PageHeader`. */
  titleAfter?: ReactNode;
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
    <Flex
      direction="column"
      flex={fill ? { md: "1" } : undefined}
      minH={fill ? { md: 0 } : undefined}
      // `flex="1"` + `minH={0}` NÃO bastam: o root dos dois shells é `minH="100vh"`
      // (não `h`), então o `<main>` cresce com o conteúdo e quem rola é a PÁGINA —
      // exatamente o que o `fill` promete evitar. A altura tem de vir do contrato
      // que os shells publicam. Não é número mágico: `--admin-content-h` é deles e
      // já desconta topbar e `BottomNav`; o fallback só cobre quem renderize fora
      // de um shell (ex.: storybook/teste).
      h={fill ? { md: "var(--admin-content-h, calc(100dvh - 132px))" } : undefined}
      // O `maxH` é o que REALMENTE segura, e o `h` sozinho não segurava: `flex="1"`
      // é `flex: 1 1 0%` — o `flex-basis: 0%` ANULA o `height` no eixo principal, e
      // como o root é `minH="100vh"` (piso, não teto), quando o conteúdo passa da
      // tela o root cresce e o `flex-grow` estica o corpo até o TAMANHO DO CONTEÚDO
      // (a página rolava, o scroll interno morria). Com conteúdo curto isto não
      // aparece — só quando a lista enche (ex.: thread longa do WhatsApp). O `maxH`
      // é relativo à VIEWPORT (`100dvh`), então trava a altura mesmo que todos os
      // ancestrais estiquem — não depende de nenhum deles ter altura definida.
      maxH={fill ? { md: "var(--admin-content-h, calc(100dvh - 132px))" } : undefined}
      // ESCAPE do próprio `fill`: se o corpo da tela é uma `DataTable` no modo
      // página (altura natural, quem rola é a janela), o teto acima passa a ser
      // um estorvo — a tabela ficaria maior que o box e vazaria por cima do que
      // vem depois. Aqui o teto é SOLTO sozinho, sem tocar em nenhuma das ~34
      // telas que já passam `fill`. As telas que precisam MESMO de scroll interno
      // (e-mail, chat, kanban) não têm esse marcador e continuam iguais.
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
        titleAfter={titleAfter}
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
