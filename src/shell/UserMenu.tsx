"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Box, HStack, Menu, Portal, Stack, Text } from "@chakra-ui/react";
import { ChevronDown, Globe, KeyRound } from "lucide-react";
import { Button } from "../components/Button";
import { UserAvatar } from "../components/UserAvatar";
import type { AppUser } from "./types";

/**
 * Item "Ir para o site" dos menus do usuário (rodapé do sidebar + dropdown do
 * topo mobile). Sai do painel logado para a página pública SEM deslogar — a
 * sessão continua guardada (só uma navegação normal). Reusado nos dois lugares
 * para não divergir. `href` pode ser relativo (`/`) ou absoluto (outro domínio).
 */
export function SiteLinkItem({ href, label }: { href: string; label?: string }) {
  return (
    <Button
      asChild
      tone="ghost"
      size="sm"
      w="full"
      justifyContent="flex-start"
      borderRadius="8px"
      color="var(--admin-primary)"
      _hover={{ bg: "var(--admin-nav-hover)", color: "var(--admin-primary)" }}
    >
      <Link href={href}>
        <Globe size={15} style={{ marginRight: 8 }} /> {label ?? "Ir para o site"}
      </Link>
    </Button>
  );
}

/** Bloco do usuário logado (Chakra Menu): iniciais + nome + dropdown com conta/logout. */
export function UserMenu({
  user,
  logoutSlot,
  accountSlot,
  accountHref,
  siteHref,
  siteLabel,
  version,
  onDark = false,
  compact = false,
}: {
  user: AppUser;
  logoutSlot?: ReactNode;
  /** Item "Meu perfil" (ex.: abre modal de conta). Tem precedência sobre accountHref. */
  accountSlot?: ReactNode;
  /** Link da área "Conta & senha" (ex.: /conta). Sem isso, o item não aparece. */
  accountHref?: string;
  /** Link "Ir para o site" (página pública). Sem isso, o item não aparece. */
  siteHref?: string;
  /** Rótulo do link do site (default "Ir para o site"). */
  siteLabel?: string;
  /** Versão do app, discreta no rodapé do dropdown (fora da topbar, que ficava poluída). */
  version?: string;
  /** Está sobre fundo colorido (topbar de marca) → nome/seta claros. O
   *  `admin-navbtn` pinta de texto escuro, então sai de cena aqui. */
  onDark?: boolean;
  /** Só avatar + seta, sem o nome. Para topbar cheia (o nome já está dentro do
   *  dropdown) — devolve espaço horizontal pros grupos do menu. */
  compact?: boolean;
}) {
  return (
    <Menu.Root positioning={{ placement: "bottom-end" }}>
      <Menu.Trigger asChild>
        <HStack
          as="button"
          className={onDark ? undefined : "admin-navbtn"}
          gap={1.5}
          h="34px"
          px={1.5}
          borderRadius="9px"
          flexShrink={0}
          cursor={onDark ? "pointer" : undefined}
          color={onDark ? "white" : undefined}
          transition={onDark ? "background 140ms ease" : undefined}
          _hover={onDark ? { bg: "rgba(255,255,255,0.15)" } : undefined}
        >
          <UserAvatar
            name={user.name || user.email || "?"}
            image={user.image}
            color={user.color}
            email={user.email}
            perfil={user.roleLabel}
            size="sm"
            showTooltip={false}
          />
          {compact ? null : (
            <Text display={{ base: "none", md: "block" }} fontSize="sm" fontWeight="600" maxW="160px" truncate>
              {user.name || user.email || "Conta"}
            </Text>
          )}
          <ChevronDown size={14} />
        </HStack>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content className="admin-dropdown" minW="230px" p={3} borderRadius="14px">
            <Stack gap={3}>
              <Box>
                <Text fontWeight="700" fontSize="sm" truncate>
                  {user.name || "Conta"}
                </Text>
                {user.email ? (
                  <Text fontSize="xs" color="var(--admin-text-soft)" truncate>
                    {user.email}
                  </Text>
                ) : null}
              </Box>
              {accountSlot ? (
                <Box borderTopWidth="1px" borderColor="var(--admin-divider)" pt={2}>
                  {accountSlot}
                </Box>
              ) : accountHref ? (
                <Box borderTopWidth="1px" borderColor="var(--admin-divider)" pt={2}>
                  <Button
                    asChild
                    tone="ghost"
                    size="sm"
                    w="full"
                    justifyContent="flex-start"
                    borderRadius="8px"
                    color="var(--admin-primary)"
                    _hover={{ bg: "var(--admin-nav-hover)", color: "var(--admin-primary)" }}
                  >
                    <Link href={accountHref}>
                      <KeyRound size={15} style={{ marginRight: 8 }} /> Conta &amp; senha
                    </Link>
                  </Button>
                </Box>
              ) : null}
              {siteHref ? (
                <Box borderTopWidth="1px" borderColor="var(--admin-divider)" pt={2}>
                  <SiteLinkItem href={siteHref} label={siteLabel} />
                </Box>
              ) : null}
              {logoutSlot ? (
                <Box borderTopWidth="1px" borderColor="var(--admin-divider)" pt={2}>
                  {logoutSlot}
                </Box>
              ) : null}
              {version ? (
                <Text fontSize="10px" color="var(--admin-text-soft)" textAlign="center" title={`Versão ${version}`}>
                  v{version}
                </Text>
              ) : null}
            </Stack>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
