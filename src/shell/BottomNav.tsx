"use client";

import { type ReactNode } from "react";
import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import { MoreHorizontal } from "lucide-react";
import { MobileNav } from "./MobileNav";
import { isItemActive, useShellNav } from "./ShellNav";
import type { Brand, NavItem, NavSection } from "./types";

const PRIMARY_HREFS: string[][] = [
  ["/dashboard"],
  ["/conversas", "/pendencias"],
  ["/clientes", "/processos", "/agendamentos"],
];

function pickItems(sections: NavSection[]): NavItem[] {
  const ordered: NavItem[] = [];
  const byHref = new Map<string, NavItem>();
  for (const s of sections)
    for (const it of s.items) {
      ordered.push(it);
      byHref.set(it.href, it);
    }

  const out: NavItem[] = [];
  const used = new Set<string>();
  for (const prefs of PRIMARY_HREFS) {
    const href = prefs.find((h) => byHref.has(h));
    if (href && !used.has(href)) {
      out.push(byHref.get(href)!);
      used.add(href);
    }
  }
  for (const it of ordered) {
    if (out.length >= 3) break;
    if (!used.has(it.href)) {
      out.push(it);
      used.add(it.href);
    }
  }
  return out.slice(0, 3);
}

function SlotInner({
  icon,
  label,
  active,
  badge,
}: {
  icon?: ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <VStack
      gap={0.5}
      justify="center"
      h="full"
      color={active ? "var(--admin-primary)" : "var(--admin-text-soft)"}
    >
      <Box position="relative" display="flex">
        {icon}
        {badge ? (
          <Box
            position="absolute"
            top="-6px"
            right="-9px"
            minW="15px"
            h="15px"
            px="3px"
            borderRadius="full"
            bg="var(--admin-accent)"
            color="#fff"
            fontSize="9px"
            fontWeight="700"
            lineHeight="15px"
            textAlign="center"
          >
            {badge}
          </Box>
        ) : null}
      </Box>
      <Text fontSize="10px" fontWeight={active ? "700" : "500"} lineClamp={1}>
        {label}
      </Text>
    </VStack>
  );
}

export function BottomNav({
  brand,
  sections,
  logoutSlot,
  items: itemsOverride,
  onMenuClick,
}: {
  brand: Brand;
  sections: NavSection[];
  logoutSlot?: ReactNode;
  items?: NavItem[];
  onMenuClick?: () => void;
}) {
  const { Link, pathname, textos } = useShellNav();
  const items = itemsOverride ? itemsOverride.slice(0, 4) : pickItems(sections);
  const menuButton = (
    <Box as="button" flex="1" minW={0} aria-label={textos.abrirMenu} onClick={onMenuClick}>
      <SlotInner icon={<MoreHorizontal size={22} />} label={textos.menu} />
    </Box>
  );
  return (
    <Flex
      as="nav"
      className="admin-bottomnav"
      display={{ base: "flex", lg: "none" }}
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={50}
      h="calc(62px + env(safe-area-inset-bottom))"
      pb="env(safe-area-inset-bottom)"
      align="stretch"
      borderTopWidth="1px"
      borderColor="var(--admin-border)"
      bg="var(--admin-surface)"
    >
      {items.map((item) => {
        const active = isItemActive(pathname, item);
        return (
          <Box asChild key={item.href} flex="1" minW={0}>
            <Link href={item.href} aria-label={item.label} aria-current={active ? "page" : undefined}>
              <SlotInner icon={item.icon} label={item.label} active={active} badge={item.badge} />
            </Link>
          </Box>
        );
      })}
      {onMenuClick ? (
        menuButton
      ) : (
        <MobileNav brand={brand} sections={sections} logoutSlot={logoutSlot} trigger={menuButton} />
      )}
    </Flex>
  );
}
