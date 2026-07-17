"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Box, Flex, HStack } from "@chakra-ui/react";
import { BottomNav } from "./BottomNav";
import { GroupRail } from "./GroupRail";
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
  /**
   * Cor da topbar: `glass` (padrão — superfície translúcida, painel staff/sistema)
   * ou `brand` (painel do TENANT: fundo na cor PRIMÁRIA da marca, navegação clara).
   * A GroupRail e o conteúdo seguem no fundo claro do painel — só o header muda.
   * Ver `.admin-topbar[data-variant]` no CSS estrutural.
   */
  topbarVariant?: "glass" | "brand";
  children: ReactNode;
}) {
  const onBrand = topbarVariant === "brand";
  // Só o ÍCONE da marca (o `logoUrl` já é a variante ícone — o horizontal com
  // nome é o `wideLogoUrl`). O nome sai do header de propósito: ele se repete no
  // título da aba e a topbar precisa do espaço horizontal pros grupos.
  //
  // Na topbar de marca (fundo na cor do tenant) o ícone precisa CONTRASTAR: usa a
  // variante escura se houver, senão pinta o ícone de branco por filtro — mesma
  // tática do sidebar do `AppShell`. Sem logo nenhum, cai no crest de iniciais.
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
            <NavSearch sections={sections} onDark={onBrand} />
          </Box>
          {searchSlot}
          {utilitiesSlot}
          {localeSlot}
          <UserMenu
            user={user}
            logoutSlot={logoutSlot}
            accountSlot={accountSlot}
            accountHref={accountHref}
            siteHref={siteHref}
            siteLabel={siteLabel}
            // A versão saiu do header (poluía) e passou pro rodapé do dropdown do
            // usuário — aparece só ao abrir "meu perfil" no cantinho.
            version={version}
            onDark={onBrand}
            // Só o avatar + seta: o nome já aparece dentro do dropdown, e aqui
            // ele competia por espaço com os grupos do menu.
            compact
          />
        </HStack>
      </Flex>

      {/* Abaixo da topbar: a sub-navegação lateral do grupo (desktop) à esquerda
          e o conteúdo à direita. A rail some abaixo de `md` e some quando não há
          grupo casando — aí o <main> volta a ocupar a linha inteira. */}
      <Flex direction="row" flex="1" minH={0} w="full" align="stretch">
        <GroupRail sections={sections} />
        <Box
          as="main"
          w="full"
          maxW="1500px"
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
            // Altura disponível pro conteúdo, já descontada a topbar e o padding
            // do <main>. É o que o `PageBody fill` e o `MailClient` consomem para
            // ocupar a tela inteira sem número mágico. Espelhado no `AppShell`.
            //
            // O DOCK (`BottomNav`, 78px) só some em `lg` — o `pb` do <main> segue
            // em `calc(78px + safe-area)` até lá. Então a conta "sem dock" (que
            // desconta só os 40px de `py`) TEM de começar em `lg` também, não em
            // `md`: o `fill` liga em `md`, e se aqui já descontássemos o dock cedo
            // demais o workspace passava ~58px do fundo e a PÁGINA rolava — o
            // oposto do que o `fill` promete (era exatamente este o bug do miolo
            // que rolava fora do maximizado).
            "--admin-content-h":
              "calc(100dvh - var(--admin-topbar-h) - 16px - 78px - env(safe-area-inset-bottom))",
            "@media (min-width: 48em)": {
              // Tablet: `py` sobe pra 20px (py md:5), mas o dock CONTINUA lá.
              "--admin-content-h":
                "calc(100dvh - var(--admin-topbar-h) - 20px - 78px - env(safe-area-inset-bottom))",
            },
            "@media (min-width: 62em)": {
              // Desktop: dock some, `pb` volta a 20px → `py` simétrico de 40px.
              "--admin-content-h": "calc(100dvh - var(--admin-topbar-h) - 40px)",
            },
          }}
        >
          {children}
        </Box>
      </Flex>

      <BottomNav brand={brand} sections={sections} logoutSlot={logoutSlot} />
    </Flex>
  );
}
