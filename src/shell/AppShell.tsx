"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Box, Flex } from "@chakra-ui/react";
import { TopNav } from "./TopNav";
import { SubNav } from "./SubNav";
import { UserMenu } from "./UserMenu";
import { MobileNav } from "./MobileNav";
import { AdminBrandLogo } from "../theme/AdminThemeShell";
import { Text } from "@chakra-ui/react";
import type { AppUser, Brand, NavSection } from "./types";

/**
 * Shell padrão dos dois painéis: TOP BAR fixa (logo à esquerda, menus por
 * categoria no centro, usuário+sair à direita) e conteúdo full-width.
 * No mobile a navegação vira hambúrguer/drawer.
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
  return (
    <Box minH="100vh">
      <Box as="header" className="admin-topbar" position="sticky" top={0} zIndex={50}>
        <Flex align="center" gap={{ base: 2, md: 4 }} h="60px" px={{ base: 3, md: 5 }}>
          <MobileNav brand={brand} sections={sections} logoutSlot={logoutSlot} />

          <Link href={homeHref} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            {brand.logoUrl ? (
              <AdminBrandLogo logoUrl={brand.logoUrl} brandName={brand.name} height={36} maxWidth={170} />
            ) : (
              <Text className="admin-h" fontWeight="700" fontSize="lg" color="var(--admin-primary)" lineHeight="1">
                {brand.name}
              </Text>
            )}
          </Link>

          <Box display={{ base: "none", lg: "block" }} flex="1" minW={0}>
            <TopNav sections={sections} />
          </Box>
          <Box flex="1" display={{ base: "block", lg: "none" }} />

          <UserMenu user={user} logoutSlot={logoutSlot} accountHref={accountHref} />
        </Flex>
      </Box>

      <SubNav sections={sections} />

      <Box as="main" w="full" maxW="1600px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 5, md: 7 }}>
        {children}
      </Box>
    </Box>
  );
}
