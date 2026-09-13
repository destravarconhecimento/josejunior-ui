"use client";

import { Box, HStack, Menu, Portal, Text } from "@chakra-ui/react";
import { ChevronDown } from "lucide-react";
import { chunkByGroup, isItemActive, useShellNav } from "./ShellNav";
import type { NavItem, NavSection } from "./types";

export function TopNav({
  sections,
  labelsFrom = "lg",
  fontSize,
}: {
  sections: NavSection[];
  labelsFrom?: "lg" | "xl";
  fontSize?: string;
}) {
  const { Link, pathname, textos, uppercase } = useShellNav();
  const labelDisplay = labelsFrom === "xl" ? { base: "none", xl: "inline" } : undefined;
  const labelCss = uppercase
    ? { fontSize: fontSize ?? "13px", textTransform: "uppercase" as const, letterSpacing: "0.03em" }
    : { fontSize: fontSize ?? "sm" };

  const renderItem = (item: NavItem) => {
    const isAct = isItemActive(pathname, item);
    return (
      <Menu.Item key={item.href} value={item.href} asChild>
        <Link href={item.href} aria-current={isAct ? "page" : undefined}>
          <HStack gap={3} w="full">
            {item.icon}
            <Text
              fontSize="sm"
              fontWeight={isAct ? "700" : "500"}
              color={isAct ? "var(--admin-primary)" : undefined}
            >
              {item.label}
            </Text>
          </HStack>
        </Link>
      </Menu.Item>
    );
  };

  return (
    <HStack as="nav" gap={1} aria-label={textos.menuPrincipal}>
      {sections.map((section) => {
        const active = section.items.some((it) => isItemActive(pathname, it));
        if (section.items.length === 1) {
          const item = section.items[0];
          return (
            <Box asChild key={section.title}>
              <Link href={item.href} aria-label={item.label} title={item.label}>
                <HStack
                  as="span"
                  className="admin-navbtn"
                  data-active={active ? "true" : "false"}
                  gap={1.5}
                  h="34px"
                  px={2.5}
                  borderRadius="9px"
                >
                  {section.icon ?? item.icon}
                  <Text fontWeight="600" display={labelDisplay} {...labelCss}>
                    {item.label}
                  </Text>
                </HStack>
              </Link>
            </Box>
          );
        }
        return (
          <Menu.Root key={section.title} positioning={{ placement: "bottom-start" }} lazyMount unmountOnExit>
            <Menu.Trigger asChild>
              <HStack
                as="button"
                className="admin-navbtn"
                data-active={active ? "true" : "false"}
                aria-label={section.title}
                title={section.title}
                gap={1.5}
                h="34px"
                px={2.5}
                borderRadius="9px"
              >
                {section.icon}
                <Text fontWeight="600" display={labelDisplay} {...labelCss}>
                  {section.title}
                </Text>
                <ChevronDown size={14} />
              </HStack>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content
                  className="admin-dropdown admin-scroll"
                  minW="230px"
                  maxH="calc(100dvh - 5rem)"
                  overflowY="auto"
                  p={2}
                  borderRadius="14px"
                >
                  {chunkByGroup(section.items).map((chunk, i) =>
                    chunk.group ? (
                      <Menu.ItemGroup key={`${chunk.group}-${i}`} mt={i === 0 ? 0 : 2}>
                        <Menu.ItemGroupLabel
                          fontSize="10px"
                          fontWeight="700"
                          textTransform="uppercase"
                          letterSpacing="0.06em"
                          color="var(--admin-text-soft)"
                          px={2}
                          py={1}
                        >
                          {chunk.group}
                        </Menu.ItemGroupLabel>
                        {chunk.items.map(renderItem)}
                      </Menu.ItemGroup>
                    ) : (
                      chunk.items.map(renderItem)
                    ),
                  )}
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        );
      })}
    </HStack>
  );
}
