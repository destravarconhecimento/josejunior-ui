"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box, CloseButton, Drawer, HStack, Portal, Stack, Text } from "@chakra-ui/react";
import { ChevronDown, Menu as MenuIcon } from "lucide-react";
import { ActiveLink } from "./ActiveLink";
import { NavSearch } from "./NavSearch";
import { chunkByGroup, isItemActive, useShellNav } from "./ShellNav";
import { AdminBrandLogo } from "../theme/AdminThemeShell";
import type { Brand, NavItem, NavSection } from "./types";

function GroupedLinks({ items, onNavigate }: { items: NavItem[]; onNavigate: () => void }) {
  return (
    <>
      {chunkByGroup(items).map((chunk, i) => (
        <Stack key={`${chunk.group ?? ""}-${i}`} gap={1}>
          {chunk.group ? (
            <Text
              fontSize="10px"
              fontWeight="700"
              textTransform="uppercase"
              letterSpacing="0.06em"
              color="var(--admin-text-soft)"
              px={3}
              pt={i === 0 ? 1 : 2}
            >
              {chunk.group}
            </Text>
          ) : null}
          {chunk.items.map((item) => (
            <ActiveLink key={item.href} item={item} onNavigate={onNavigate} />
          ))}
        </Stack>
      ))}
    </>
  );
}

function DrawerSections({
  sections,
  collapsible,
  onNavigate,
}: {
  sections: NavSection[];
  collapsible: boolean;
  onNavigate: () => void;
}) {
  const { pathname, uppercase } = useShellNav();
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});

  return (
    <Stack gap={collapsible ? 1 : 5} py={2}>
      {sections.map((section) => {
        if (section.items.length === 1) {
          return <ActiveLink key={section.title} item={section.items[0]} onNavigate={onNavigate} />;
        }
        if (!collapsible) {
          return (
            <Stack key={section.title} gap={1.5}>
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
              <GroupedLinks items={section.items} onNavigate={onNavigate} />
            </Stack>
          );
        }
        const ativo = section.items.some((it) => isItemActive(pathname, it));
        const aberto = abertos[section.title] ?? ativo;
        return (
          <Stack key={section.title} gap={1}>
            <HStack
              as="button"
              className="admin-nav-item"
              data-active={ativo && !aberto ? "true" : "false"}
              aria-expanded={aberto}
              onClick={() => setAbertos((a) => ({ ...a, [section.title]: !aberto }))}
              gap={3}
              px={3}
              py={2.5}
              borderRadius="10px"
              w="full"
              textAlign="left"
            >
              {section.icon ? (
                <Box flexShrink={0} display="inline-flex">
                  {section.icon}
                </Box>
              ) : null}
              <Text
                flex="1"
                fontSize={uppercase ? "13px" : "sm"}
                fontWeight="600"
                textTransform={uppercase ? "uppercase" : undefined}
                letterSpacing={uppercase ? "0.03em" : undefined}
              >
                {section.title}
              </Text>
              <Box
                display="inline-flex"
                transform={aberto ? "rotate(180deg)" : undefined}
                transition="transform .15s ease"
              >
                <ChevronDown size={16} />
              </Box>
            </HStack>
            {aberto ? (
              <Stack gap={1} pl={3}>
                <GroupedLinks items={section.items} onNavigate={onNavigate} />
              </Stack>
            ) : null}
          </Stack>
        );
      })}
    </Stack>
  );
}

export function MobileNav({
  brand,
  sections,
  logoutSlot,
  trigger,
  open: openProp,
  onOpenChange,
  topSlot,
  bottomSlot,
  collapsible = false,
  searchSuggestions,
}: {
  brand: Brand;
  sections: NavSection[];
  logoutSlot?: ReactNode;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  topSlot?: ReactNode;
  bottomSlot?: ReactNode;
  collapsible?: boolean;
  searchSuggestions?: NavItem[];
}) {
  const { pathname, textos } = useShellNav();
  const [openInner, setOpenInner] = useState(false);
  const open = openProp ?? openInner;
  const setOpen = (value: boolean) => {
    if (openProp === undefined) setOpenInner(value);
    onOpenChange?.(value);
  };
  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;
  const prevPath = useRef(pathname);
  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    setOpenRef.current(false);
  }, [pathname]);

  const close = () => setOpen(false);

  return (
    <Box display={trigger ? "contents" : { base: "block", lg: "none" }}>
      <Drawer.Root
        open={open}
        onOpenChange={(e) => setOpen(e.open)}
        placement="start"
        size="xs"
        lazyMount
        unmountOnExit
      >
        <Drawer.Trigger asChild>
          {trigger ?? (
            <Box as="button" className="admin-navbtn" aria-label={textos.abrirMenu} p={2} borderRadius="10px">
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
                {topSlot ? <Box mb={3}>{topSlot}</Box> : null}
                <Box mb={3}>
                  <NavSearch sections={sections} onNavigate={close} suggestions={searchSuggestions} />
                </Box>
                <DrawerSections sections={sections} collapsible={collapsible} onNavigate={close} />
                {bottomSlot ? <Box mt={4}>{bottomSlot}</Box> : null}
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
