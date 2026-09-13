"use client";

import { useState, type ReactNode } from "react";
import NextLink from "next/link";
import { Box, Flex, HStack } from "@chakra-ui/react";
import { BottomNav } from "./BottomNav";
import { GroupRail } from "./GroupRail";
import { MobileNav } from "./MobileNav";
import { NavSearch } from "./NavSearch";
import { TopNav } from "./TopNav";
import { UserMenu } from "./UserMenu";
import { ShellNavProvider, type ShellLinkComponent, type ShellTextos } from "./ShellNav";
import { AdminBrandLogo, AdminCrest, initialsFrom } from "../theme/AdminThemeShell";
import { ColorModeButton, useColorModeSwitchable } from "../provider/color-mode";
import type { AppUser, Brand, NavItem, NavSection } from "./types";

export function TopBarShell({
  brand,
  sections,
  user,
  logoutSlot,
  accountSlot,
  homeHref = "/dashboard",
  accountHref,
  siteHref,
  siteLabel,
  version,
  searchSlot,
  utilitiesSlot,
  localeSlot,
  contextSlot,
  drawerTopSlot,
  drawerBottomSlot,
  topbarVariant = "glass",
  linkComponent,
  pathname,
  onNavigate,
  textos,
  bottomItems,
  menuOpen,
  onMenuOpenChange,
  searchSuggestions,
  searchHotkey = false,
  search = true,
  navFontSize,
  rail,
  navUppercase,
  navLabelsFrom = "lg",
  contentMaxW = "1500px",
  mobileCollapsible = false,
  children,
}: {
  brand: Brand;
  sections: NavSection[];
  user: AppUser;
  logoutSlot?: ReactNode;
  accountSlot?: ReactNode;
  homeHref?: string;
  accountHref?: string;
  siteHref?: string;
  siteLabel?: string;
  version?: string;
  searchSlot?: ReactNode;
  utilitiesSlot?: ReactNode;
  localeSlot?: ReactNode;
  contextSlot?: ReactNode;
  drawerTopSlot?: ReactNode;
  drawerBottomSlot?: ReactNode;
  topbarVariant?: "glass" | "brand";
  linkComponent?: ShellLinkComponent;
  pathname?: string;
  onNavigate?: (href: string) => void;
  textos?: Partial<ShellTextos>;
  bottomItems?: NavItem[];
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  searchSuggestions?: NavItem[];
  searchHotkey?: boolean;
  search?: boolean;
  navFontSize?: string;
  rail?: { autoCollapseBelow?: number; collapsedRoutes?: string[] };
  navUppercase?: boolean;
  navLabelsFrom?: "lg" | "xl";
  contentMaxW?: string;
  mobileCollapsible?: boolean;
  children: ReactNode;
}) {
  const onBrand = topbarVariant === "brand";
  const podeTrocarTema = useColorModeSwitchable();
  const [menuOpenInner, setMenuOpenInner] = useState(false);
  const drawerOpen = menuOpen ?? menuOpenInner;
  const setDrawerOpen = (value: boolean) => {
    if (menuOpen === undefined) setMenuOpenInner(value);
    onMenuOpenChange?.(value);
  };
  const HomeLink = (linkComponent ?? NextLink) as ShellLinkComponent;

  const brandMark =
    onBrand && (brand.darkLogoUrl || brand.logoUrl) ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={brand.darkLogoUrl || brand.logoUrl}
        alt={brand.name}
        style={{
          height: 28,
          width: "auto",
          maxWidth: 40,
          objectFit: "contain",
          display: "block",
          filter: brand.darkLogoUrl ? "none" : "brightness(0) invert(1)",
        }}
      />
    ) : brand.logoUrl ? (
      <AdminBrandLogo logoUrl={brand.logoUrl} brandName={brand.name} height={28} maxWidth={40} />
    ) : (
      <AdminCrest initials={initialsFrom(brand.name)} size={28} />
    );

  return (
    <ShellNavProvider
      linkComponent={linkComponent}
      pathname={pathname}
      navigate={onNavigate}
      textos={textos}
      uppercase={navUppercase}
    >
      <Flex
        direction="column"
        minH="100vh"
        css={{
          "--admin-topbar-h": "calc(56px + env(safe-area-inset-top))",
          "@media (min-width: 62em)": { "--admin-topbar-h": "52px" },
          paddingRight: "var(--jj-fab-dock, 0px)",
          transition: "padding-right .22s ease",
        }}
      >
        <Flex
          as="header"
          className="admin-topbar"
          data-variant={onBrand ? "brand" : undefined}
          position="sticky"
          top={0}
          zIndex={50}
          align="center"
          gap={2}
          h="var(--admin-topbar-h)"
          pt={{ base: "env(safe-area-inset-top)", lg: 0 }}
          px={{ base: 3, lg: 4 }}
          flexShrink={0}
          color={onBrand ? "white" : undefined}
        >
          <Box display={{ base: "block", lg: "none" }}>
            <MobileNav
              brand={brand}
              sections={sections}
              logoutSlot={logoutSlot}
              open={drawerOpen}
              onOpenChange={setDrawerOpen}
              topSlot={drawerTopSlot}
              bottomSlot={drawerBottomSlot}
              collapsible={mobileCollapsible}
              searchSuggestions={searchSuggestions}
              search={search}
            />
          </Box>

          <HomeLink href={homeHref} style={{ display: "flex", alignItems: "center", flexShrink: 0, minWidth: 0 }}>
            {brandMark}
          </HomeLink>

          <Box display={{ base: "none", lg: "block" }} ml={2} minW={0}>
            <TopNav sections={sections} labelsFrom={navLabelsFrom} fontSize={navFontSize} />
          </Box>

          <HStack ml="auto" gap={2} align="center" flexShrink={0}>
            {contextSlot}
            {search ? (
              <Box display={{ base: "none", md: "block" }} w={{ md: "200px", xl: "260px" }}>
                <NavSearch sections={sections} onDark={onBrand} suggestions={searchSuggestions} hotkey={searchHotkey} />
              </Box>
            ) : null}
            {searchSlot}
            {utilitiesSlot}
            {podeTrocarTema ? <ColorModeButton onDark={onBrand} /> : null}
            {localeSlot}
            <UserMenu
              user={user}
              logoutSlot={logoutSlot}
              accountSlot={accountSlot}
              accountHref={accountHref}
              siteHref={siteHref}
              siteLabel={siteLabel}
              version={version}
              onDark={onBrand}
              compact
            />
          </HStack>
        </Flex>

        <Flex direction="row" flex="1" minH={0} w="full" align="stretch">
          <GroupRail
            sections={sections}
            autoCollapseBelow={rail?.autoCollapseBelow}
            collapsedRoutes={rail?.collapsedRoutes}
          />
          <Box
            as="main"
            w="full"
            maxW={contentMaxW}
            mx="auto"
            minW={0}
            px={{ base: 4, md: 7 }}
            py={{ base: 4, md: 5 }}
            pb={{ base: "calc(78px + env(safe-area-inset-bottom))", lg: 5 }}
            flex="1"
            minH={0}
            display="flex"
            flexDirection="column"
            css={{
              "--admin-content-h":
                "calc(100dvh - var(--admin-topbar-h) - 16px - 78px - env(safe-area-inset-bottom))",
              "--admin-sticky-top": "var(--admin-topbar-h)",
              "--admin-sticky-bottom": "calc(78px + env(safe-area-inset-bottom))",
              "@media (min-width: 48em)": {
                "--admin-content-h":
                  "calc(100dvh - var(--admin-topbar-h) - 20px - 78px - env(safe-area-inset-bottom))",
              },
              "@media (min-width: 62em)": {
                "--admin-content-h": "calc(100dvh - var(--admin-topbar-h) - 40px)",
                "--admin-sticky-bottom": "0px",
              },
            }}
          >
            {children}
          </Box>
        </Flex>

        <BottomNav
          brand={brand}
          sections={sections}
          logoutSlot={logoutSlot}
          items={bottomItems}
          onMenuClick={() => setDrawerOpen(true)}
        />
      </Flex>
    </ShellNavProvider>
  );
}
