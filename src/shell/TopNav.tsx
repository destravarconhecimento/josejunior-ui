"use client";

import { HStack, Menu, Portal, Text } from "@chakra-ui/react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActiveHref } from "./ActiveLink";
import type { NavSection } from "./types";

/** Menus por categoria na top bar (Chakra Menu — abre no clique). */
export function TopNav({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  return (
    <HStack as="nav" gap={1}>
      {sections.map((section) => {
        const active = section.items.some((it) => isActiveHref(pathname, it.href));
        return (
          <Menu.Root key={section.title} positioning={{ placement: "bottom-start" }}>
            <Menu.Trigger asChild>
              <HStack
                as="button"
                className="admin-navbtn"
                data-active={active ? "true" : "false"}
                gap={1}
                px={3}
                py={2}
                borderRadius="10px"
              >
                <Text fontSize="sm" fontWeight="600">
                  {section.title}
                </Text>
                <ChevronDown size={14} />
              </HStack>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content className="admin-dropdown" minW="230px" p={2} borderRadius="14px">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isAct = isActiveHref(pathname, item.href);
                    return (
                      <Menu.Item key={item.href} value={item.href} asChild>
                        <Link href={item.href}>
                          <HStack gap={3} w="full">
                            {Icon ? <Icon size={16} /> : null}
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
                  })}
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        );
      })}
    </HStack>
  );
}
