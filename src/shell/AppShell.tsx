"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Flex, HStack, Stack, Text, VStack } from "@chakra-ui/react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { MobileNav } from "./MobileNav";
import { UserMenu } from "./UserMenu";
import { isActiveHref } from "./ActiveLink";
import { AdminBrandLogo, AdminCrest, initialsFrom } from "../theme/AdminThemeShell";
import type { AppUser, Brand, NavSection } from "./types";

const STORAGE_KEY = "admin-sidebar-collapsed";

/**
 * Shell padrão dos painéis: SIDEBAR escura fixa à esquerda, RECOLHÍVEL (estilo
 * Claude — recolhe pra só ícones, estado salvo no localStorage). Topo = crest do
 * tenant + "Acesso restrito" (some ao recolher); navegação agrupada com ícones e
 * item ativo em gradiente; usuário no rodapé; área principal clara. No mobile a
 * sidebar some e vira topbar + drawer. A cor adapta-se à marca (color-mix --admin-*).
 */
export function AppShell({
  brand,
  sections,
  user,
  logoutSlot,
  homeHref = "/dashboard",
  accountHref,
  children,
}: {
  brand: Brand;
  sections: NavSection[];
  user: AppUser;
  logoutSlot?: ReactNode;
  homeHref?: string;
  accountHref?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const brandInitials = initialsFrom(brand.name);
  const userInitials = user.initials || initialsFrom(user.name, user.email);

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

  return (
    <Flex minH="100vh" align="stretch">
      {/* ── Sidebar (desktop, recolhível) ───────────────────────────────── */}
      <Box
        as="aside"
        className="admin-sidebar"
        display={{ base: "none", lg: "flex" }}
        flexDirection="column"
        w={collapsed ? "76px" : "264px"}
        flexShrink={0}
        position="sticky"
        top={0}
        alignSelf="flex-start"
        h="100vh"
      >
        {/* topo: crest do tenant + "Acesso restrito" */}
        <Box px={collapsed ? 0 : 5} py={5} flexShrink={0}>
          <Link
            href={homeHref}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 10,
            }}
            title={collapsed ? brand.name : undefined}
          >
            <AdminCrest initials={brandInitials} size={collapsed ? 38 : 36} />
            {!collapsed ? (
              <VStack gap={0} align="stretch" minW={0}>
                <Text className="admin-h" color="white" fontWeight="700" fontSize="sm" lineClamp={1}>
                  {brand.name}
                </Text>
                <Text color="rgba(255,255,255,0.5)" fontSize="xs" lineClamp={1}>
                  Acesso restrito
                </Text>
              </VStack>
            ) : null}
          </Link>
        </Box>

        {/* navegação */}
        <Box flex="1" overflowY="auto" overflowX="hidden" className="admin-scroll" px={collapsed ? 2 : 3} pb={3}>
          <Stack gap={collapsed ? 1 : 4}>
            {sections.map((section, si) => (
              <Stack key={section.title} gap={0.5}>
                {!collapsed ? (
                  <Text
                    className="admin-side-title"
                    fontSize="11px"
                    fontWeight="700"
                    textTransform="uppercase"
                    letterSpacing="0.06em"
                    px={3}
                    pt={1}
                    pb={1}
                  >
                    {section.title}
                  </Text>
                ) : si > 0 ? (
                  <Box mx={2} my={1} borderTopWidth="1px" borderColor="rgba(255,255,255,0.08)" />
                ) : null}
                {section.items.map((item) => {
                  const active = isActiveHref(pathname, item.href);
                  return (
                    <Box asChild key={item.href}>
                      <Link href={item.href}>
                        <HStack
                          className="admin-side-item"
                          data-active={active ? "true" : "false"}
                          gap={3}
                          px={collapsed ? 0 : 3}
                          py={2.5}
                          justify={collapsed ? "center" : "flex-start"}
                          title={collapsed ? item.label : undefined}
                        >
                          {item.icon ? (
                            <Box flexShrink={0} display="flex" opacity={active ? 1 : 0.85}>
                              {item.icon}
                            </Box>
                          ) : null}
                          {!collapsed ? (
                            <>
                              <Text fontSize="sm" fontWeight={active ? "600" : "500"} lineClamp={1}>
                                {item.label}
                              </Text>
                              {item.badge ? (
                                <Box
                                  ml="auto"
                                  flexShrink={0}
                                  fontSize="10px"
                                  fontWeight="700"
                                  px={1.5}
                                  py={0.5}
                                  borderRadius="full"
                                  bg="rgba(255,255,255,0.16)"
                                  color="white"
                                >
                                  {item.badge}
                                </Box>
                              ) : null}
                            </>
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

        {/* rodapé: usuário + recolher */}
        <Box flexShrink={0} px={collapsed ? 2 : 4} py={3} borderTopWidth="1px" borderColor="rgba(255,255,255,0.08)">
          <HStack gap={2.5} mb={collapsed ? 2 : 3} justify={collapsed ? "center" : "flex-start"} minW={0}>
            <AdminCrest initials={userInitials} size={34} />
            {!collapsed ? (
              <VStack gap={0} align="stretch" minW={0}>
                <Text color="white" fontSize="sm" fontWeight="600" lineClamp={1}>
                  {user.name || "Conta"}
                </Text>
                {user.email ? (
                  <Text color="rgba(255,255,255,0.5)" fontSize="xs" lineClamp={1}>
                    {user.email}
                  </Text>
                ) : null}
              </VStack>
            ) : null}
          </HStack>

          {!collapsed && logoutSlot ? <Box mb={2}>{logoutSlot}</Box> : null}

          <HStack
            as="button"
            className="admin-side-item"
            onClick={toggle}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir" : "Recolher"}
            w="full"
            gap={2}
            px={collapsed ? 0 : 3}
            py={2}
            justify="center"
            color="rgba(255,255,255,0.6)"
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            {!collapsed ? (
              <Text fontSize="xs" fontWeight="600">
                Recolher
              </Text>
            ) : null}
          </HStack>
        </Box>
      </Box>

      {/* ── Conteúdo ────────────────────────────────────────────────────── */}
      <Flex direction="column" flex="1" minW={0}>
        <Flex
          className="admin-topbar"
          display={{ base: "flex", lg: "none" }}
          position="sticky"
          top={0}
          zIndex={50}
          align="center"
          gap={2}
          h="60px"
          px={3}
        >
          <MobileNav brand={brand} sections={sections} logoutSlot={logoutSlot} />
          <Link href={homeHref} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            {brand.logoUrl ? (
              <AdminBrandLogo logoUrl={brand.logoUrl} brandName={brand.name} height={32} maxWidth={150} />
            ) : (
              <Text className="admin-h" fontWeight="700" fontSize="md" color="var(--admin-primary)">
                {brand.name}
              </Text>
            )}
          </Link>
          <Box ml="auto">
            <UserMenu user={user} logoutSlot={logoutSlot} accountHref={accountHref} />
          </Box>
        </Flex>

        <Box as="main" w="full" maxW="1500px" mx="auto" px={{ base: 4, md: 7 }} py={{ base: 5, md: 7 }}>
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
