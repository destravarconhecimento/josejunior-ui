"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HStack, Text } from "@chakra-ui/react";
import type { NavItem } from "./types";

export function isActiveHref(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

/** Item de navegação (dropdown / drawer) com estado ativo por rota. */
export function ActiveLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActiveHref(pathname, item.href);
  const Icon = item.icon;
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
        {Icon ? <Icon size={17} /> : null}
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
