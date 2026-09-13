"use client";

import { useEffect, useState } from "react";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { chunkByGroup, isActiveHref, isItemActive, useShellNav } from "./ShellNav";
import type { NavSection } from "./types";

const STORAGE_KEY = "admin-grouprail-collapsed";

export function GroupRail({
  sections,
  autoCollapseBelow,
  collapsedRoutes,
}: {
  sections: NavSection[];
  autoCollapseBelow?: number;
  collapsedRoutes?: string[];
}) {
  const { Link, pathname, textos, uppercase } = useShellNav();
  const [collapsedPref, setCollapsedPref] = useState(false);
  const [excecao, setExcecao] = useState<string | null>(null);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo === "1") setCollapsedPref(true);
      else if (salvo === null && autoCollapseBelow && window.innerWidth < autoCollapseBelow) setCollapsedPref(true);
    } catch {}
  }, [autoCollapseBelow]);

  const rotaForcada = collapsedRoutes?.find((r) => isActiveHref(pathname, r)) ?? null;

  useEffect(() => {
    if (excecao && excecao !== rotaForcada) setExcecao(null);
  }, [excecao, rotaForcada]);

  const collapsed = rotaForcada ? excecao !== rotaForcada : collapsedPref;

  const toggle = () => {
    if (rotaForcada) {
      setExcecao((e) => (e === rotaForcada ? null : rotaForcada));
      return;
    }
    setCollapsedPref((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  const section = sections.find((s) => s.items.some((it) => isItemActive(pathname, it)));
  if (!section || section.items.length < 2) return null;

  return (
    <Box
      as="aside"
      display={{ base: "none", md: "flex" }}
      flexDirection="column"
      flexShrink={0}
      w={collapsed ? "56px" : "232px"}
      borderRight="1px solid var(--admin-divider)"
      transition="width 0.18s ease"
    >
      <Box
        position="sticky"
        top="var(--admin-topbar-h)"
        maxH="calc(100dvh - var(--admin-topbar-h))"
        overflowY="auto"
        className="admin-scroll"
        px={collapsed ? 2 : 3}
        py={4}
      >
        <HStack justify={collapsed ? "center" : "space-between"} align="center" mb={2} px={collapsed ? 0 : 1}>
          {!collapsed ? (
            <HStack gap={1.5} minW={0} color="var(--admin-text-soft)">
              {section.icon ? (
                <Box flexShrink={0} display="inline-flex">
                  {section.icon}
                </Box>
              ) : null}
              <Text
                fontSize="11px"
                fontWeight="700"
                textTransform="uppercase"
                letterSpacing="0.06em"
                lineClamp={1}
              >
                {section.title}
              </Text>
            </HStack>
          ) : null}
          <HStack
            as="button"
            className="admin-navbtn"
            onClick={toggle}
            aria-label={collapsed ? textos.expandirSubmenu : textos.recolherSubmenu}
            title={collapsed ? textos.expandirSubmenu : textos.recolherSubmenu}
            justify="center"
            w="28px"
            h="28px"
            flexShrink={0}
            borderRadius="8px"
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </HStack>
        </HStack>

        <Stack as="nav" gap={0.5} aria-label={section.title}>
          {chunkByGroup(section.items).map((chunk, ci) => (
            <Stack key={`${chunk.group ?? ""}-${ci}`} gap={0.5}>
              {chunk.group ? (
                collapsed ? (
                  <Box h="1px" bg="var(--admin-divider)" mx={1} my={2} />
                ) : (
                  <Text
                    fontSize="10px"
                    fontWeight="700"
                    textTransform="uppercase"
                    letterSpacing="0.06em"
                    color="var(--admin-text-soft)"
                    px={3}
                    pt={ci === 0 ? 1 : 3}
                    pb={1}
                    lineClamp={1}
                  >
                    {chunk.group}
                  </Text>
                )
              ) : null}
              {chunk.items.map((item) => {
                const active = isItemActive(pathname, item);
                return (
                  <Box asChild key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      aria-label={collapsed ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                    >
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
                          <Text
                            fontSize={uppercase ? "13px" : "sm"}
                            fontWeight={active ? "600" : "500"}
                            textTransform={uppercase ? "uppercase" : undefined}
                            lineClamp={1}
                          >
                            {item.label}
                          </Text>
                        ) : null}
                        {!collapsed && item.badge ? (
                          <Text
                            ml="auto"
                            fontSize="2xs"
                            fontWeight="700"
                            px={1.5}
                            borderRadius="full"
                            bg="var(--admin-nav-active)"
                            color="var(--admin-primary)"
                          >
                            {item.badge}
                          </Text>
                        ) : null}
                      </HStack>
                    </Link>
                  </Box>
                );
              })}
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
