import type { ReactNode } from "react";
import Link from "next/link";
import { Box, Text } from "@chakra-ui/react";

/**
 * Atalho com contador pro `utilitiesSlot` da topbar (ex.: e-mails não lidos).
 * Server-friendly de propósito — é só link + número, sem estado: o contador vem
 * pronto do layout (Server Component) e atualiza na navegação. Sino com fetch
 * ao vivo é outro componente.
 *
 * `count = 0` some com a bolinha, mas mantém o atalho (o ícone ainda navega).
 */
export function NavBadgeLink({
  href,
  icon,
  label,
  count = 0,
  onDark = false,
}: {
  href: string;
  /** Ícone JÁ renderizado (ex.: <Mail size={17} />). */
  icon: ReactNode;
  /** Rótulo acessível — o botão é só ícone. */
  label: string;
  count?: number;
  /** Sobre fundo colorido (topbar de marca) → ícone claro, sem anel na badge. */
  onDark?: boolean;
}) {
  const shown = count > 99 ? "99+" : String(count);
  return (
    <Box asChild position="relative" display="inline-flex" flexShrink={0}>
      <Link href={href} aria-label={count > 0 ? `${label} (${count} não lidos)` : label} title={label}>
        <Box
          className={onDark ? undefined : "admin-navbtn"}
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          boxSize="34px"
          borderRadius="9px"
          color={onDark ? "white" : undefined}
          _hover={onDark ? { bg: "rgba(255,255,255,0.15)" } : undefined}
        >
          {icon}
        </Box>
        {count > 0 ? (
          <Text
            position="absolute"
            top="-2px"
            right="-2px"
            minW="16px"
            h="16px"
            px="4px"
            borderRadius="full"
            bg="#dc2626"
            color="white"
            fontSize="9px"
            fontWeight="800"
            lineHeight="16px"
            textAlign="center"
            pointerEvents="none"
            // Anel só sobre fundo claro (separa a badge da superfície); em fundo
            // escuro o vermelho já contrasta e o anel viraria um halo.
            style={onDark ? undefined : { boxShadow: "0 0 0 2px var(--admin-surface, #fff)" }}
          >
            {shown}
          </Text>
        ) : null}
      </Link>
    </Box>
  );
}
