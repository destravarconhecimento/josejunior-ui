"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import { BottomNav } from "./BottomNav";
import { MobileNav } from "./MobileNav";
import { NavSearch } from "./NavSearch";
import { TopNav } from "./TopNav";
import { UserMenu } from "./UserMenu";
import { AdminBrandLogo, AdminCrest, initialsFrom } from "../theme/AdminThemeShell";
import type { AppUser, Brand, NavSection } from "./types";

/**
 * Shell HORIZONTAL: header fixo no topo com a marca, os GRUPOS do menu como
 * dropdowns (`TopNav`), busca e usuário à direita; conteúdo em largura cheia
 * abaixo. Alternativa ao `AppShell` (sidebar escura) para painéis com muitas
 * telas mas poucos grupos — o sistema usa este.
 *
 * Mobile: header vira hambúrguer + marca + usuário (drawer do `MobileNav`) e a
 * `BottomNav` continua no rodapé, igual ao `AppShell`.
 */
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
  /** Link "Ir para o site" (página pública) no menu do usuário. */
  siteHref?: string;
  siteLabel?: string;
  /** Versão exibida discreta no canto direito do header. */
  version?: string;
  /** Acessório à direita da busca (ex.: botão de instalar o PWA). */
  searchSlot?: ReactNode;
  /** Atalhos com badge no header (ex.: sino/e-mail). */
  utilitiesSlot?: ReactNode;
  /** Seletor de idioma (só quando o tenant é multilíngue). */
  localeSlot?: ReactNode;
  children: ReactNode;
}) {
  // Só o ÍCONE da marca (o `logoUrl` já é a variante ícone — o horizontal com
  // nome é o `wideLogoUrl`). O nome sai do header de propósito: ele se repete no
  // título da aba e a topbar precisa do espaço horizontal pros grupos.
  const brandMark = brand.logoUrl ? (
    <AdminBrandLogo logoUrl={brand.logoUrl} brandName={brand.name} height={28} maxWidth={40} />
  ) : (
    <AdminCrest initials={initialsFrom(brand.name)} size={28} />
  );

  return (
    <Flex
      direction="column"
      minH="100vh"
      css={{
        // Altura REAL da topbar, publicada pro conteúdo poder se medir sem
        // chumbar número mágico (ver `--admin-content-h` no <main>).
        "--admin-topbar-h": "calc(56px + env(safe-area-inset-top))",
        "@media (min-width: 62em)": { "--admin-topbar-h": "52px" },
      }}
    >
      <Flex
        as="header"
        className="admin-topbar"
        position="sticky"
        top={0}
        zIndex={50}
        align="center"
        gap={2}
        h="var(--admin-topbar-h)"
        pt={{ base: "env(safe-area-inset-top)", lg: 0 }}
        px={{ base: 3, lg: 4 }}
        flexShrink={0}
      >
        {/* mobile: hambúrguer abre o drawer com o menu completo */}
        <Box display={{ base: "block", lg: "none" }}>
          <MobileNav brand={brand} sections={sections} logoutSlot={logoutSlot} />
        </Box>

        <Link href={homeHref} style={{ display: "flex", alignItems: "center", flexShrink: 0, minWidth: 0 }}>
          {brandMark}
        </Link>

        {/* grupos do menu como dropdowns (desktop) */}
        <Box display={{ base: "none", lg: "block" }} ml={2} minW={0}>
          <TopNav sections={sections} />
        </Box>

        <HStack ml="auto" gap={2} align="center" flexShrink={0}>
          <Box display={{ base: "none", md: "block" }} w={{ md: "200px", xl: "260px" }}>
            <NavSearch sections={sections} />
          </Box>
          {searchSlot}
          {utilitiesSlot}
          {localeSlot}
          {version ? (
            <Text
              display={{ base: "none", xl: "block" }}
              fontSize="10px"
              color="var(--admin-text-soft)"
              lineClamp={1}
              title={`Versão ${version}`}
            >
              v{version}
            </Text>
          ) : null}
          <UserMenu
            user={user}
            logoutSlot={logoutSlot}
            accountSlot={accountSlot}
            accountHref={accountHref}
            siteHref={siteHref}
            siteLabel={siteLabel}
            // Só o avatar + seta: o nome já aparece dentro do dropdown, e aqui
            // ele competia por espaço com os grupos do menu.
            compact
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
          // Altura disponível pro conteúdo, já descontada a topbar e o padding
          // do <main>. É o que o `PageBody fill` e o `MailClient` consomem para
          // ocupar a tela inteira sem número mágico. Espelhado no `AppShell`.
          "--admin-content-h":
            "calc(100dvh - var(--admin-topbar-h) - 16px - 78px - env(safe-area-inset-bottom))",
          "@media (min-width: 48em)": {
            "--admin-content-h": "calc(100dvh - var(--admin-topbar-h) - 40px)",
          },
        }}
      >
        {children}
      </Box>

      <BottomNav brand={brand} sections={sections} logoutSlot={logoutSlot} />
    </Flex>
  );
}
