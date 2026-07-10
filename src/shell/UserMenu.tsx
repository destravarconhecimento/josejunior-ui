"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Box, HStack, Menu, Portal, Stack, Text } from "@chakra-ui/react";
import { ChevronDown, Globe, KeyRound } from "lucide-react";
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
    <Link
      href={href}
      style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--admin-primary)", padding: "6px 4px" }}
    >
      <Globe size={14} /> {label ?? "Ir para o site"}
    </Link>
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
}) {
  return (
    <Menu.Root positioning={{ placement: "bottom-end" }}>
      <Menu.Trigger asChild>
        <HStack
          as="button"
          className="admin-navbtn"
          gap={2}
          px={2}
          py={1.5}
          borderRadius="10px"
          flexShrink={0}
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
          <Text display={{ base: "none", md: "block" }} fontSize="sm" fontWeight="600" maxW="160px" truncate>
            {user.name || user.email || "Conta"}
          </Text>
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
                  <Link
                    href={accountHref}
                    style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--admin-primary)", padding: "6px 4px" }}
                  >
                    <KeyRound size={14} /> Conta &amp; senha
                  </Link>
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
            </Stack>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
