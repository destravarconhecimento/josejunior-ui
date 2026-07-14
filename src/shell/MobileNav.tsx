"use client";

import { useState, type ReactNode } from "react";
import { Box, CloseButton, Drawer, HStack, Input, Portal, Stack, Text } from "@chakra-ui/react";
import { Menu as MenuIcon, Search } from "lucide-react";
import { ActiveLink } from "./ActiveLink";
import { filterSections } from "./navFilter";
import { AdminBrandLogo } from "../theme/AdminThemeShell";
import type { Brand, NavSection } from "./types";

/**
 * Hambúrguer + Drawer (Chakra) com a mesma navegação agrupada — mobile.
 * `trigger` opcional substitui o botão hambúrguer (ex.: item "Menu" da BottomNav).
 */
export function MobileNav({
  brand,
  sections,
  logoutSlot,
  trigger,
}: {
  brand: Brand;
  sections: NavSection[];
  logoutSlot?: ReactNode;
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const visibleSections = filterSections(sections, query);
  return (
    <Box display={trigger ? "contents" : { base: "block", lg: "none" }}>
      <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)} placement="start" size="xs">
        <Drawer.Trigger asChild>
          {trigger ?? (
            <Box as="button" className="admin-navbtn" aria-label="Abrir menu" p={2} borderRadius="10px">
              <MenuIcon size={20} />
            </Box>
          )}
        </Drawer.Trigger>
        <Portal>
          <Drawer.Backdrop bg="rgba(0,0,0,0.45)" />
          <Drawer.Positioner>
            <Drawer.Content bg="var(--admin-surface)">
              <Drawer.Header borderBottomWidth="1px" borderColor="var(--admin-border)">
                {brand.logoUrl ? (
                  <AdminBrandLogo logoUrl={brand.logoUrl} brandName={brand.name} height={34} maxWidth={150} />
                ) : (
                  <Text className="admin-h" fontWeight="700" color="var(--admin-primary)">
                    {brand.name}
                  </Text>
                )}
                <Drawer.CloseTrigger asChild>
                  <CloseButton />
                </Drawer.CloseTrigger>
              </Drawer.Header>
              <Drawer.Body className="admin-scroll">
                <HStack
                  gap={2}
                  px={3}
                  h="40px"
                  mb={3}
                  borderRadius="10px"
                  bg="var(--admin-surface-2)"
                  borderWidth="1px"
                  borderColor="var(--admin-border)"
                >
                  <Box color="var(--admin-text-soft)" flexShrink={0} display="flex">
                    <Search size={16} />
                  </Box>
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                    placeholder="Buscar no menu…"
                    aria-label="Buscar no menu"
                    unstyled
                    flex="1"
                    minW={0}
                    h="full"
                    fontSize="sm"
                    color="var(--admin-text)"
                    _placeholder={{ color: "var(--admin-text-soft)" }}
                    _focusVisible={{ outline: "none" }}
                  />
                </HStack>
                {visibleSections.length === 0 ? (
                  <Text px={1} py={2} fontSize="sm" color="var(--admin-text-soft)">
                    Nada encontrado.
                  </Text>
                ) : null}
                <Stack gap={5} py={2}>
                  {visibleSections.map((section) => (
                    <Stack key={section.title} gap={1.5}>
                      {section.items.length > 1 ? (
                        <Text
                          fontSize="10px"
                          fontWeight="700"
                          textTransform="uppercase"
                          letterSpacing="1.4px"
                          color="var(--admin-text-soft)"
                          px={3}
                        >
                          {section.title}
                        </Text>
                      ) : null}
                      {/* 1 item por linha (linha cheia) — mais legível que a grade. */}
                      {section.items.map((item) => (
                        <ActiveLink key={item.href} item={item} onNavigate={() => setOpen(false)} />
                      ))}
                    </Stack>
                  ))}
                </Stack>
              </Drawer.Body>
              {logoutSlot ? (
                <Drawer.Footer borderTopWidth="1px" borderColor="var(--admin-border)">
                  <Box w="full">{logoutSlot}</Box>
                </Drawer.Footer>
              ) : null}
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </Box>
  );
}
