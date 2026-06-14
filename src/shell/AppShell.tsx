"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Flex, HStack, Stack, Text, VStack } from "@chakra-ui/react";
import { MobileNav } from "./MobileNav";
import { UserMenu } from "./UserMenu";
import { isActiveHref } from "./ActiveLink";
import { AdminBrandLogo, AdminCrest, initialsFrom } from "../theme/AdminThemeShell";
import type { AppUser, Brand, NavSection } from "./types";

/**
 * Shell padrão dos painéis: SIDEBAR escura fixa à esquerda (logo + crest no topo,
 * navegação agrupada com ícones e item ativo em gradiente, usuário no rodapé) e
 * área principal clara. No mobile a sidebar some e vira topbar + drawer.
 * A cor da sidebar adapta-se à marca de cada app (color-mix sobre --admin-*).
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

  return (
    <Flex minH="100vh" align="stretch">
      {/* ── Sidebar (desktop) ───────────────────────────────────────────── */}
      <Box
        as="aside"
        className="admin-sidebar"
        display={{ base: "none", lg: "flex" }}
        flexDirection="column"
        w="264px"
        flexShrink={0}
        position="sticky"
        top={0}
        alignSelf="flex-start"
        h="100vh"
      >
        <Box px={5} py={5} flexShrink={0}>
          <Link href={homeHref} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AdminCrest initials={brandInitials} size={36} />
            <Text className="admin-h" color="white" fontWeight="700" fontSize="md" lineClamp={1}>
              {brand.name}
            </Text>
          </Link>
        </Box>

        <Box flex="1" overflowY="auto" className="admin-scroll" px={3} pb={3}>
          <Stack gap={4}>
            {sections.map((section) => (
              <Stack key={section.title} gap={0.5}>
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
                {section.items.map((item) => {
                  const active = isActiveHref(pathname, item.href);
                  return (
                    <Box asChild key={item.href}>
                      <Link href={item.href}>
                        <HStack
                          className="admin-side-item"
                          data-active={active ? "true" : "false"}
                          gap={3}
                          px={3}
                          py={2.5}
                        >
                          {item.icon ? (
                            <Box flexShrink={0} display="flex" opacity={active ? 1 : 0.85}>
                              {item.icon}
                            </Box>
                          ) : null}
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
                        </HStack>
                      </Link>
                    </Box>
                  );
                })}
              </Stack>
            ))}
          </Stack>
        </Box>

        <Box flexShrink={0} px={4} py={4} borderTopWidth="1px" borderColor="rgba(255,255,255,0.08)">
          <HStack gap={2.5} mb={logoutSlot ? 3 : 0} minW={0}>
            <AdminCrest initials={userInitials} size={34} />
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
          </HStack>
          {logoutSlot}
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
