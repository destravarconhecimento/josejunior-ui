"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Flex, HStack, Input, Menu, Portal, Stack, Text, VStack } from "@chakra-ui/react";
import { ChevronsUpDown, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { MobileNav } from "./MobileNav";
import { BottomNav } from "./BottomNav";
import { UserMenu } from "./UserMenu";
import { isActiveHref } from "./ActiveLink";
import { filterSections } from "./navFilter";
import { AdminBrandLogo, AdminCrest, initialsFrom } from "../theme/AdminThemeShell";
import { UserAvatar } from "../components/UserAvatar";
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
  accountSlot,
  homeHref = "/dashboard",
  accountHref,
  version,
  searchSlot,
  utilitiesSlot,
  children,
}: {
  brand: Brand;
  sections: NavSection[];
  user: AppUser;
  logoutSlot?: ReactNode;
  /** Item "Meu perfil" do menu do usuário (ex.: abre modal de conta). */
  accountSlot?: ReactNode;
  homeHref?: string;
  accountHref?: string;
  /** Versão exibida no rodapé do sidebar (canto inferior esquerdo). */
  version?: string;
  /** Acessório à direita da busca do menu (ex.: botão de instalar o PWA). */
  searchSlot?: ReactNode;
  /** Atalhos com badge no rodapé do sidebar, acima do menu do usuário (ex.: sino/e-mail). */
  utilitiesSlot?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const brandInitials = initialsFrom(brand.name);

  const [query, setQuery] = useState("");
  const visibleSections = filterSections(sections, query);

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

  const renderToggle = () => (
    <HStack
      as="button"
      className="admin-side-item"
      onClick={toggle}
      aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
      title={collapsed ? "Expandir" : "Recolher"}
      justify="center"
      w="30px"
      h="30px"
      flexShrink={0}
      color="rgba(255,255,255,0.6)"
    >
      {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
    </HStack>
  );

  return (
    <Flex minH="100vh" align="stretch">
      {/* ── Sidebar (desktop, recolhível) ───────────────────────────────── */}
      <Box
        as="aside"
        className="admin-sidebar"
        display={{ base: "none", lg: "flex" }}
        flexDirection="column"
        w={collapsed ? "84px" : "264px"}
        flexShrink={0}
        position="sticky"
        top={0}
        alignSelf="flex-start"
        h="100vh"
      >
        {/* topo: ÍCONE anexado ao tenant + nome/"Acesso restrito" + recolher ao lado */}
        <Box px={collapsed ? 2 : 4} py={4} flexShrink={0}>
          <HStack justify="space-between" align="center" gap={1.5}>
            <Link
              href={homeHref}
              style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}
              title={collapsed ? brand.name : undefined}
            >
              {brand.logoUrl ? (
                // Fundo escuro do sidebar: SEM caixa branca. Usa a variante dark
                // do ícone se houver; senão pinta o ícone original de branco via
                // filtro (brightness(0) invert(1)) — limpo e profissional.
                <Box
                  w={collapsed ? "34px" : "40px"}
                  h={collapsed ? "34px" : "40px"}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={brand.darkLogoUrl || brand.logoUrl}
                    alt={brand.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      filter: brand.darkLogoUrl ? "none" : "brightness(0) invert(1)",
                    }}
                  />
                </Box>
              ) : (
                <AdminCrest initials={brandInitials} size={collapsed ? 34 : 40} />
              )}
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
            {renderToggle()}
          </HStack>
        </Box>

        {/* busca no menu (só expandido — recolhido não cabe) */}
        {!collapsed ? (
          <Box px={4} pb={2} flexShrink={0}>
            <HStack gap={2} align="center">
            <HStack
              gap={2}
              px={3}
              h="38px"
              flex="1"
              minW={0}
              borderRadius="10px"
              bg="rgba(255,255,255,0.06)"
              borderWidth="1px"
              borderColor="rgba(255,255,255,0.12)"
            >
              <Box color="rgba(255,255,255,0.5)" flexShrink={0} display="flex">
                <Search size={15} />
              </Box>
              <Input
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                placeholder="Buscar no menu…"
                aria-label="Buscar no menu"
                type="text"
                name="busca-menu"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
                unstyled
                flex="1"
                minW={0}
                h="full"
                bg="transparent"
                border="none"
                fontSize="sm"
                color="white"
                _placeholder={{ color: "rgba(255,255,255,0.45)" }}
                _focusVisible={{ outline: "none" }}
              />
            </HStack>
            {searchSlot}
            </HStack>
          </Box>
        ) : null}

        {/* navegação */}
        <Box flex="1" overflowY="auto" overflowX="hidden" className="admin-scroll" px={collapsed ? 2 : 3} pb={3}>
          {!collapsed && visibleSections.length === 0 ? (
            <Text px={3} py={4} fontSize="sm" color="rgba(255,255,255,0.5)">
              Nada encontrado.
            </Text>
          ) : null}
          <Stack gap={collapsed ? 1 : 4}>
            {(collapsed ? sections : visibleSections).map((section, si) => (
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
                              <VStack gap={0} align="start" minW={0}>
                                <Text fontSize="sm" fontWeight={active ? "600" : "500"} lineClamp={1}>
                                  {item.label}
                                </Text>
                                {item.description ? (
                                  <Text fontSize="10px" color="var(--admin-text-soft)" lineClamp={1}>
                                    {item.description}
                                  </Text>
                                ) : null}
                              </VStack>
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

        {/* rodapé: menu do usuário (avatar + nome + cargo) e, na MESMA linha à direita,
            os atalhos com badge (e-mail/sino). Recolhido: atalhos empilham acima. */}
        <Box flexShrink={0} px={collapsed ? 2 : 3} py={3} borderTopWidth="1px" borderColor="rgba(255,255,255,0.08)">
          {collapsed && utilitiesSlot ? <Box mb={2.5}>{utilitiesSlot}</Box> : null}
          <HStack gap={1.5} align="center">
            <Box flex="1" minW={0}>
              <Menu.Root positioning={{ placement: collapsed ? "right-end" : "top" }}>
                <Menu.Trigger asChild>
                  <HStack
                    as="button"
                    className="admin-side-item"
                    w="full"
                    gap={2.5}
                    px={collapsed ? 0 : 3}
                    py={2}
                    justify={collapsed ? "center" : "flex-start"}
                    title={collapsed ? user.name || "Conta" : undefined}
                  >
                    <UserAvatar
                      name={user.name || user.email || "?"}
                      image={user.image}
                      color={user.color}
                      email={user.email}
                      perfil={user.roleLabel}
                      size="sm"
                    />
                    {!collapsed ? (
                      <>
                        <VStack gap={0} align="stretch" minW={0} flex="1">
                          <Text color="white" fontSize="sm" fontWeight="600" lineClamp={1}>
                            {user.name || "Conta"}
                          </Text>
                          {user.roleLabel || user.email ? (
                            <Text color="rgba(255,255,255,0.5)" fontSize="xs" lineClamp={1}>
                              {user.roleLabel || user.email}
                            </Text>
                          ) : null}
                        </VStack>
                        {/* seta do menu só quando NÃO há atalhos à direita (apps sem utilitiesSlot) */}
                        {!utilitiesSlot ? (
                          <Box color="rgba(255,255,255,0.5)" flexShrink={0}>
                            <ChevronsUpDown size={15} />
                          </Box>
                        ) : null}
                      </>
                    ) : null}
                  </HStack>
                </Menu.Trigger>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content className="admin-dropdown" minW="240px" p={2} borderRadius="14px">
                      <Box px={2.5} py={1.5}>
                        <Text fontSize="sm" fontWeight="700" color="var(--admin-text)" lineClamp={1}>
                          {user.name || "Conta"}
                        </Text>
                        {user.email ? (
                          <Text fontSize="xs" color="var(--admin-text-soft)" lineClamp={1}>
                            {user.email}
                          </Text>
                        ) : null}
                      </Box>
                      <Box mb={1} mx={1} borderTopWidth="1px" borderColor="var(--admin-divider)" />
                      {accountSlot}
                      {accountSlot && logoutSlot ? (
                        <Box my={1} mx={1} borderTopWidth="1px" borderColor="var(--admin-divider)" />
                      ) : null}
                      {logoutSlot}
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            </Box>
            {!collapsed && utilitiesSlot ? <Box flexShrink={0}>{utilitiesSlot}</Box> : null}
          </HStack>
        </Box>

        {/* versão (canto inferior esquerdo, discreto) */}
        {version ? (
          <Box flexShrink={0} px={collapsed ? 1 : 4} pb={2}>
            <Text
              fontSize="10px"
              color="rgba(255,255,255,0.32)"
              textAlign={collapsed ? "center" : "left"}
              lineClamp={1}
              title={`Versão ${version}`}
            >
              {collapsed ? version.split(" ")[0] : `v${version}`}
            </Text>
          </Box>
        ) : null}
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
          h="calc(60px + env(safe-area-inset-top))"
          pt="env(safe-area-inset-top)"
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
            <UserMenu user={user} logoutSlot={logoutSlot} accountSlot={accountSlot} accountHref={accountHref} />
          </Box>
        </Flex>

        <Box
          as="main"
          w="full"
          maxW="1500px"
          mx="auto"
          px={{ base: 4, md: 7 }}
          py={{ base: 5, md: 7 }}
          pb={{ base: "calc(78px + env(safe-area-inset-bottom))", lg: 7 }}
        >
          {children}
        </Box>
        {/* Navegação inferior (mobile) — fixa; conteúdo ganha padding-bottom acima. */}
        <BottomNav brand={brand} sections={sections} logoutSlot={logoutSlot} />
      </Flex>
    </Flex>
  );
}
