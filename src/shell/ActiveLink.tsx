"use client";

import { Box, HStack, Text } from "@chakra-ui/react";
import { isItemActive, useShellNav } from "./ShellNav";
import type { NavItem } from "./types";

export { isActiveHref } from "./ShellNav";

export function ActiveLink({
  item,
  onNavigate,
  dense = false,
}: {
  item: NavItem;
  onNavigate?: () => void;
  dense?: boolean;
}) {
  const { Link, pathname } = useShellNav();
  const active = isItemActive(pathname, item);

  if (dense) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
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
      aria-current={active ? "page" : undefined}
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
