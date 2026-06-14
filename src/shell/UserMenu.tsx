"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Box, HStack, Menu, Portal, Stack, Text } from "@chakra-ui/react";
import { ChevronDown, KeyRound } from "lucide-react";
import { AdminCrest, initialsFrom } from "../theme/AdminThemeShell";
import type { AppUser } from "./types";

/** Bloco do usuário logado (Chakra Menu): iniciais + nome + dropdown com conta/logout. */
export function UserMenu({
  user,
  logoutSlot,
  accountSlot,
  accountHref,
}: {
  user: AppUser;
  logoutSlot?: ReactNode;
  /** Item "Meu perfil" (ex.: abre modal de conta). Tem precedência sobre accountHref. */
  accountSlot?: ReactNode;
  /** Link da área "Conta & senha" (ex.: /conta). Sem isso, o item não aparece. */
  accountHref?: string;
}) {
  const initials = user.initials || initialsFrom(user.name, user.email);
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
          <AdminCrest initials={initials} size={32} logoUrl={user.image || undefined} />
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
