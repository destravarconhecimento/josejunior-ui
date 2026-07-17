"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { isActiveHref } from "./ActiveLink";
import type { NavSection } from "./types";

const STORAGE_KEY = "admin-grouprail-collapsed";

/**
 * Sub-navegação LATERAL (desktop, md+) do `TopBarShell`: quando a página está
 * dentro de um GRUPO do menu do topo, os itens IRMÃOS desse grupo aparecem numa
 * coluna à esquerda — no FUNDO PADRÃO do painel (sem caixa branca), separada do
 * conteúdo por um divisor fino. Recolhível pra só ícones (estado no localStorage).
 *
 * Some abaixo de `md`: no mobile/tablet estreito a navegação já é o hambúrguer
 * (`MobileNav`) + a `BottomNav`. O divisor é propositalmente DISCRETO pra não
 * competir com abas verticais que a própria tela porventura tenha (ex.: o editor
 * de landing), evitando a confusão de "duas barras verticais".
 */
export function GroupRail({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
    } catch {}
  }, []);
  const toggle = () =>
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });

  const section = sections.find((s) => s.items.some((it) => isActiveHref(pathname, it.href)));
  // Grupo de 1 item (ou nenhum grupo casando com a rota) não rende: não há
  // "irmãos" pra navegar, e uma coluna vazia só roubaria espaço do conteúdo.
  if (!section || section.items.length < 2) return null;

  return (
    <Box
      as="aside"
      // Só md pra cima. Abaixo disso, hambúrguer + BottomNav dão conta.
      display={{ base: "none", md: "flex" }}
      flexDirection="column"
      flexShrink={0}
      w={collapsed ? "56px" : "232px"}
      // Divisor SIMPLES: uma linha fina, no tom de divisor do painel.
      borderRight="1px solid var(--admin-divider)"
      transition="width 0.18s ease"
    >
      <Box
        // Acompanha o scroll da página, ancorado logo abaixo da topbar.
        position="sticky"
        top="var(--admin-topbar-h)"
        maxH="calc(100dvh - var(--admin-topbar-h))"
        overflowY="auto"
        className="admin-scroll"
        px={collapsed ? 2 : 3}
        py={4}
      >
        {/* cabeçalho da coluna: nome do grupo + botão de recolher */}
        <HStack justify={collapsed ? "center" : "space-between"} align="center" mb={2} px={collapsed ? 0 : 1}>
          {!collapsed ? (
            <Text
              fontSize="11px"
              fontWeight="700"
              color="var(--admin-text-soft)"
              textTransform="uppercase"
              letterSpacing="0.06em"
              lineClamp={1}
            >
              {section.title}
            </Text>
          ) : null}
          <HStack
            as="button"
            className="admin-navbtn"
            onClick={toggle}
            aria-label={collapsed ? "Expandir sub-menu" : "Recolher sub-menu"}
            title={collapsed ? "Expandir" : "Recolher"}
            justify="center"
            w="28px"
            h="28px"
            flexShrink={0}
            borderRadius="8px"
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </HStack>
        </HStack>

        {/* itens irmãos do grupo */}
        <Stack as="nav" gap={0.5}>
          {section.items.map((item) => {
            const active = isActiveHref(pathname, item.href);
            return (
              <Box asChild key={item.href}>
                <Link href={item.href} title={collapsed ? item.label : undefined}>
                  <HStack
                    className="admin-nav-item"
                    data-active={active ? "true" : "false"}
                    gap={2.5}
                    px={collapsed ? 0 : 3}
                    py={2}
                    justify={collapsed ? "center" : "flex-start"}
                    borderRadius="10px"
                  >
                    {item.icon ? (
                      <Box flexShrink={0} display="inline-flex">
                        {item.icon}
                      </Box>
                    ) : null}
                    {!collapsed ? (
                      <Text fontSize="sm" fontWeight={active ? "600" : "500"} lineClamp={1}>
                        {item.label}
                      </Text>
                    ) : null}
                  </HStack>
                </Link>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}
