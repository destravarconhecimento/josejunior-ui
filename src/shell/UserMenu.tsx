"use client";

import type { ReactNode } from "react";
import { Box, HStack, Menu, Portal, Stack, Text } from "@chakra-ui/react";
import { ChevronDown, Globe, KeyRound } from "lucide-react";
import { Button } from "../components/Button";
import { UserAvatar } from "../components/UserAvatar";
import { useShellNav } from "./ShellNav";
import type { AppUser } from "./types";

export function SiteLinkItem({ href, label }: { href: string; label?: string }) {
  const { Link, textos } = useShellNav();
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
        <Globe size={15} style={{ marginRight: 8 }} /> {label ?? textos.irParaSite}
      </Link>
    </Button>
  );
}

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
  accountSlot?: ReactNode;
  accountHref?: string;
  siteHref?: string;
  siteLabel?: string;
  version?: string;
  onDark?: boolean;
  compact?: boolean;
}) {
  const { Link, textos } = useShellNav();
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
                      <KeyRound size={15} style={{ marginRight: 8 }} /> {textos.contaSenha}
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
                <Text fontSize="10px" color="var(--admin-text-soft)" textAlign="center" title={`v${version}`}>
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
