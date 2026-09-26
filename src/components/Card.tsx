import type { ReactNode } from "react";
import { Box, HStack, Text, type BoxProps } from "@chakra-ui/react";

/** Card padrão (.admin-card). Com `title`/`actions` opcionais no topo.
 *  `interactive` (use em cards clicáveis) ativa a elevação no hover/foco.
 *
 *  Desde 26/09 o título é uma FAIXA compacta com divisor — a mesma faixa que a
 *  DataTable desenha com `tituloNaBarra` —, para Card e tabela lerem como UMA
 *  caixa padrão só. Quem passa `p`/`padding` próprio fica no layout antigo
 *  (título dentro do corpo), porque a faixa depende do padding padrão. */
export function Card({
  title,
  actions,
  children,
  bodyProps,
  interactive,
  ...rest
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  bodyProps?: BoxProps;
  interactive?: boolean;
} & Omit<BoxProps, "title">) {
  const pPersonalizado = "p" in rest || "padding" in rest;
  const faixa = (title || actions) && !pPersonalizado;
  const cabecalho =
    title || actions ? (
      <HStack
        justify="space-between"
        align="center"
        gap={3}
        flexWrap="wrap"
        {...(faixa
          ? { px: { base: 4, md: 5 }, py: 2.5, borderBottomWidth: "1px", borderColor: "var(--admin-divider)" }
          : { mb: 4 })}
      >
        {typeof title === "string" ? (
          <Text fontWeight="700" fontSize="sm" color="var(--admin-primary)">
            {title}
          </Text>
        ) : (
          title
        )}
        {actions ? <HStack gap={2}>{actions}</HStack> : null}
      </HStack>
    ) : null;
  return (
    <Box
      className="admin-card"
      data-interactive={interactive ? "true" : undefined}
      tabIndex={interactive && rest.onClick ? 0 : undefined}
      p={faixa ? 0 : { base: 4, md: 5 }}
      overflow={faixa ? "hidden" : undefined}
      {...rest}
    >
      {cabecalho}
      <Box {...(faixa ? { p: { base: 4, md: 5 } } : null)} {...bodyProps}>
        {children}
      </Box>
    </Box>
  );
}
