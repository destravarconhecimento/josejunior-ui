"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import { MoreHorizontal } from "lucide-react";
import { MobileNav } from "./MobileNav";
import { isActiveHref } from "./ActiveLink";
import type { Brand, NavItem, NavSection } from "./types";

/**
 * Destinos primários da barra inferior (mobile). Para cada slot, usa o primeiro
 * href disponível conforme os módulos/RBAC do tenant (cai pro próximo). O 4º
 * slot é sempre "Menu" → abre o drawer completo do MobileNav.
 */
const PRIMARY_HREFS: string[][] = [
  ["/dashboard"],
  ["/conversas", "/pendencias"],
  ["/clientes", "/processos", "/agendamentos"],
];

function pickItems(sections: NavSection[]): NavItem[] {
  const all = new Map<string, NavItem>();
  for (const s of sections) for (const it of s.items) all.set(it.href, it);
  const out: NavItem[] = [];
  for (const prefs of PRIMARY_HREFS) {
    const href = prefs.find((h) => all.has(h));
    const item = href ? all.get(href) : undefined;
    if (item) out.push(item);
  }
  return out;
}

/** Conteúdo interno de um slot (ícone + rótulo), com estado ativo. */
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

/**
 * Barra de navegação inferior — SÓ mobile. 3 destinos principais + "Menu" (abre
 * o drawer). Fixa no rodapé; herda as cores do tenant via `--admin-*`. Alvos de
 * toque ≥ 48px (cada slot ocupa 1/4 da largura × 62px de altura).
 */
export function BottomNav({
  brand,
  sections,
  logoutSlot,
}: {
  brand: Brand;
  sections: NavSection[];
  logoutSlot?: ReactNode;
}) {
  const pathname = usePathname();
  const items = pickItems(sections);
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
      h="62px"
      align="stretch"
      borderTopWidth="1px"
      borderColor="var(--admin-border)"
      bg="var(--admin-surface)"
    >
      {items.map((item) => {
        const active = isActiveHref(pathname, item.href);
        return (
          <Box asChild key={item.href} flex="1" minW={0}>
            <Link href={item.href} aria-label={item.label}>
              <SlotInner icon={item.icon} label={item.label} active={active} badge={item.badge} />
            </Link>
          </Box>
        );
      })}
      <MobileNav
        brand={brand}
        sections={sections}
        logoutSlot={logoutSlot}
        trigger={
          <Box as="button" flex="1" minW={0} aria-label="Abrir menu">
            <SlotInner icon={<MoreHorizontal size={22} />} label="Menu" />
          </Box>
        }
      />
    </Flex>
  );
}
