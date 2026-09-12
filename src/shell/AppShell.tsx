"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Flex, HStack, Menu, Portal, Stack, Text, VStack } from "@chakra-ui/react";
import { ChevronsUpDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { NavSearch } from "./NavSearch";
import { UserMenu, SiteLinkItem } from "./UserMenu";
import { ColorModeButton, useColorModeSwitchable } from "../provider/color-mode";
import { isActiveHref } from "./ActiveLink";
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
  siteHref,
  siteLabel,
  accountLabel,
  version,
  searchSlot,
  utilitiesSlot,
  localeSlot,
  topbarVariant = "glass",
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
  /** Link "Ir para o site" (página pública) no menu do usuário. Sem isso, não aparece. */
  siteHref?: string;
  /** Rótulo do link do site (default "Ir para o site"). */
  siteLabel?: string;
  /** Rótulo do gatilho da conta ("Ver meu perfil") — vira o tooltip do avatar.
   *  Vem do app porque, como o `accountSlot`, precisa passar pelo tradutor. */
  accountLabel?: string;
  /** Versão exibida no rodapé do sidebar (canto inferior esquerdo). */
  version?: string;
  /** Acessório à direita da busca do menu (ex.: botão de instalar o PWA). */
  searchSlot?: ReactNode;
  /** Atalhos com badge no rodapé do sidebar, acima do menu do usuário (ex.: sino/e-mail). */
  utilitiesSlot?: ReactNode;
  /** Seletor de idioma (só passado quando o tenant é multilíngue) — rodapé + topbar mobile. */
  localeSlot?: ReactNode;
  /**
   * Topbar mobile: `glass` (padrão — superfície translúcida, painel staff/sistema)
   * ou `brand` (portal do cliente: fundo na cor PRIMÁRIA do tenant, logo completo
   * em branco + sino de notificações + avatar). Ver `.admin-topbar[data-variant]`.
   */
  topbarVariant?: "glass" | "brand";
  children: ReactNode;
}) {
  const pathname = usePathname();
  const brandInitials = initialsFrom(brand.name);
  // Topbar na cor da marca (portal do cliente) — muda fundo, logo e contraste.
  const onBrandTopbar = topbarVariant === "brand";
  // Logo do topo: o horizontal COMPLETO de preferência; cai no ícone da sidebar.
  const topbarLogo = brand.wideLogoUrl || brand.logoUrl;

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

  // Atalhos do rodapé numa fileira só: sino/e-mail + idioma. O seletor tinha linha
  // própria e virava uma pílula solta boiando acima do avatar. Mesma ordem da topbar
  // mobile (sino → idioma → usuário). `wrap` porque recolhido a sidebar tem 84px.
  const podeTrocarTema = useColorModeSwitchable();
  const botaoTema = podeTrocarTema ? <ColorModeButton onDark /> : null;
  const utilities =
    utilitiesSlot || localeSlot || botaoTema ? (
      <HStack gap={1.5} justify="center" flexWrap="wrap">
        {utilitiesSlot}
        {botaoTema}
        {localeSlot}
      </HStack>
    ) : null;

  return (
    <Flex
      minH="100vh"
      align="stretch"
      // FAB encostado na direita: o painel EMPURRA a página em vez de tapá-la
      // (a sidebar fica no lugar, o miolo é que encolhe). Vale 0 quando não há
      // nada acoplado; ver `--jj-fab-dock` no CSS estrutural.
      css={{ paddingRight: "var(--jj-fab-dock, 0px)", transition: "padding-right .22s ease" }}
    >
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
              <Box flex="1" minW={0}>
                <NavSearch sections={sections} onDark />
              </Box>
              {searchSlot}
            </HStack>
          </Box>
        ) : null}

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
          {collapsed && utilities ? <Box mb={2.5}>{utilities}</Box> : null}
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
                    // Recolhido só sobra o avatar → o nome PRECISA vir no tooltip.
                    // Aberto o nome já está à vista, então o tooltip serve pra dizer
                    // o que o clique faz (o gatilho não tem rótulo visível).
                    title={
                      collapsed
                        ? [accountLabel, user.name].filter(Boolean).join(" · ") || "Conta"
                        : accountLabel || undefined
                    }
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
                        {/* seta do menu só quando NÃO há atalhos à direita (apps sem atalhos) */}
                        {!utilities ? (
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
                      {siteHref ? (
                        <>
                          {accountSlot ? (
                            <Box my={1} mx={1} borderTopWidth="1px" borderColor="var(--admin-divider)" />
                          ) : null}
                          <SiteLinkItem href={siteHref} label={siteLabel} />
                        </>
                      ) : null}
                      {(accountSlot || siteHref) && logoutSlot ? (
                        <Box my={1} mx={1} borderTopWidth="1px" borderColor="var(--admin-divider)" />
                      ) : null}
                      {logoutSlot}
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            </Box>
            {!collapsed && utilities ? <Box flexShrink={0}>{utilities}</Box> : null}
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
          data-variant={onBrandTopbar ? "brand" : undefined}
          display={{ base: "flex", lg: "none" }}
          position="sticky"
          top={0}
          zIndex={50}
          align="center"
          gap={2}
          h="calc(56px + env(safe-area-inset-top))"
          pt="env(safe-area-inset-top)"
          px={3}
          color={onBrandTopbar ? "white" : undefined}
        >
          <Link href={homeHref} style={{ display: "flex", alignItems: "center", flexShrink: 0, minWidth: 0 }}>
            {onBrandTopbar ? (
              // Topbar de marca: o logo COMPLETO (nome/tagline), não o ícone, e do
              // jeito que o tenant subiu — SEM filtro de cor. A marca é dele.
              topbarLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={topbarLogo}
                  alt={brand.name}
                  style={{
                    height: 34,
                    width: "auto",
                    maxWidth: 200,
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              ) : (
                <Text className="admin-h" fontWeight="700" fontSize="md" color="white" lineClamp={1}>
                  {brand.name}
                </Text>
              )
            ) : brand.logoUrl ? (
              <AdminBrandLogo logoUrl={brand.logoUrl} brandName={brand.name} height={32} maxWidth={150} />
            ) : (
              <Text className="admin-h" fontWeight="700" fontSize="md" color="var(--admin-primary)">
                {brand.name}
              </Text>
            )}
          </Link>
          <HStack ml="auto" gap={1.5} align="center" flexShrink={0}>
            {/* Sino/atalhos: no portal vêm pra topbar (é o único lugar no mobile —
                a sidebar não existe aqui). No staff/sistema seguem só na sidebar.
                Ordem: sino → idioma → usuário. */}
            {onBrandTopbar ? utilitiesSlot : null}
            {podeTrocarTema ? <ColorModeButton onDark={onBrandTopbar} /> : null}
            {localeSlot}
            <UserMenu
              user={user}
              logoutSlot={logoutSlot}
              accountSlot={accountSlot}
              accountHref={accountHref}
              siteHref={siteHref}
              siteLabel={siteLabel}
              onDark={onBrandTopbar}
            />
          </HStack>
        </Flex>

        <Box
          as="main"
          w="full"
          maxW="1500px"
          mx="auto"
          px={{ base: 4, md: 7 }}
          py={{ base: 4, md: 5 }}
          pb={{ base: "calc(78px + env(safe-area-inset-bottom))", lg: 5 }}
          flex="1"
          minH={0}
          display="flex"
          flexDirection="column"
          css={{
            // Mesmo contrato do `TopBarShell`: altura disponível pro conteúdo.
            // Aqui a topbar SÓ existe no mobile (no desktop é a sidebar), então
            // a partir de lg não há header a descontar.
            //
            // O DOCK (`BottomNav`, 78px) só some em `lg` — o `pb` do <main> segue
            // em `calc(78px + safe-area)` até lá. Então em `md` (onde o `fill`
            // liga) o dock AINDA ocupa o rodapé e a conta precisa descontá-lo;
            // descontar só os 40px de `py` cedo demais empurrava o workspace
            // ~58px pra fora e passava o scroll pra página (o miolo que rolava).
            "--admin-content-h":
              "calc(100dvh - 56px - env(safe-area-inset-top) - 16px - 78px - env(safe-area-inset-bottom))",
            // Segundo contrato, pro que gruda NA JANELA (o `thead`/rodapé da
            // `DataTable` em modo página). Não é a mesma conta do `--admin-content-h`:
            // aqui interessa só o que TAMPA a janela — a topbar em cima e o dock
            // embaixo —, sem os paddings do <main>.
            "--admin-sticky-top": "calc(56px + env(safe-area-inset-top))",
            "--admin-sticky-bottom": "calc(78px + env(safe-area-inset-bottom))",
            "@media (min-width: 48em)": {
              // Tablet: `py` sobe pra 20px, mas o dock CONTINUA lá.
              "--admin-content-h":
                "calc(100dvh - 56px - env(safe-area-inset-top) - 20px - 78px - env(safe-area-inset-bottom))",
            },
            // Desktop: sidebar no lugar da topbar e sem dock → só os 40px de `py`.
            "@media (min-width: 62em)": {
              "--admin-content-h": "calc(100dvh - 40px)",
              // Sem topbar e sem dock: nada tampa a janela, o sticky gruda em 0.
              "--admin-sticky-top": "0px",
              "--admin-sticky-bottom": "0px",
            },
          }}
        >
          {children}
        </Box>
        {/* Navegação inferior (mobile) — fixa; conteúdo ganha padding-bottom acima. */}
        <BottomNav brand={brand} sections={sections} logoutSlot={logoutSlot} />
      </Flex>
    </Flex>
  );
}
