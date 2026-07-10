"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, HStack, Text } from "@chakra-ui/react";
import type { NavItem } from "./types";

export function isActiveHref(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

/** Item de navegação (dropdown / drawer) com estado ativo por rota.
 *  `dense` = tile compacto p/ grade de 2 colunas (mobile): ícone + rótulo
 *  truncado, altura mínima de toque, sem descrição. */
export function ActiveLink({
  item,
  onNavigate,
  dense = false,
}: {
  item: NavItem;
  onNavigate?: () => void;
  dense?: boolean;
}) {
  const pathname = usePathname();
  const active = isActiveHref(pathname, item.href);

  if (dense) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        style={{ display: "block", textDecoration: "none", minWidth: 0 }}
      >
        <HStack
          className="admin-nav-item"
          data-active={active ? "true" : "false"}
          gap={2}
          px={2.5}
          py={2}
          minH="44px"
          minW={0}
          borderRadius="10px"
        >
          <Box flexShrink={0} display="inline-flex">
            {item.icon}
          </Box>
          <Text fontSize="xs" fontWeight="600" flex="1" minW={0} truncate>
            {item.label}
          </Text>
          {item.badge ? (
            <Text
              flexShrink={0}
              fontSize="9px"
              fontWeight="700"
              px={1.5}
              py={0.5}
              borderRadius="full"
              bg="var(--admin-nav-active)"
              color="var(--admin-primary)"
            >
              {item.badge}
            </Text>
          ) : null}
        </HStack>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      style={{ display: "block", textDecoration: "none" }}
    >
      <HStack
        className="admin-nav-item"
        data-active={active ? "true" : "false"}
        gap={3}
        px={3}
        py={2.5}
        borderRadius="10px"
      >
        {item.icon}
        <Text fontSize="sm">{item.label}</Text>
        {item.badge ? (
          <Text
            ml="auto"
            fontSize="2xs"
            fontWeight="700"
            px={1.5}
            py={0.5}
            borderRadius="full"
            bg="var(--admin-nav-active)"
            color="var(--admin-primary)"
          >
            {item.badge}
          </Text>
        ) : null}
      </HStack>
    </Link>
  );
}
