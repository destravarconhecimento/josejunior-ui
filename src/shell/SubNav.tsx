"use client";

import { Box, HStack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActiveHref } from "./ActiveLink";
import type { NavSection } from "./types";

/**
 * Sub-navegação CONTEXTUAL: faixa logo abaixo do header (levemente cinza) com os
 * itens IRMÃOS do grupo da página atual; o item ativo fica marcado. No mobile já
 * aparece aberta (scroll horizontal) — é a navegação dentro da seção, já que os
 * menus do topo ficam no hambúrguer.
 */
export function SubNav({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  const section = sections.find((s) =>
    s.items.some((it) => isActiveHref(pathname, it.href)),
  );
  if (!section || section.items.length < 2) return null;

  return (
    <Box
      bg="var(--admin-subnav-bg, #eef1f5)"
      borderBottom="1px solid var(--admin-divider)"
      position="sticky"
      top="60px"
      zIndex={40}
    >
      <HStack
        as="nav"
        gap={1}
        maxW="1600px"
        mx="auto"
        px={{ base: 3, md: 6 }}
        py={2}
        overflowX="auto"
        css={{ "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none" }}
      >
        <Text
          fontSize="xs"
          fontWeight="700"
          color="var(--admin-text-soft)"
          textTransform="uppercase"
          letterSpacing="0.06em"
          mr={2}
          flexShrink={0}
          display={{ base: "none", md: "block" }}
        >
          {section.title}
        </Text>
        {section.items.map((it) => {
          const active = isActiveHref(pathname, it.href);
          return (
            <Box asChild key={it.href} flexShrink={0}>
              <Link href={it.href}>
                <HStack
                  gap={2}
                  px={3}
                  py={1.5}
                  borderRadius="8px"
                  bg={active ? "white" : "transparent"}
                  color={active ? "var(--admin-primary)" : "var(--admin-text-soft)"}
                  fontWeight={active ? 700 : 500}
                  boxShadow={active ? "0 1px 2px rgba(7,26,51,0.10)" : "none"}
                  transition="background 0.12s"
                  _hover={{ bg: active ? "white" : "rgba(7,26,51,0.05)" }}
                >
                  {it.icon}
                  <Text fontSize="sm" whiteSpace="nowrap">
                    {it.label}
                  </Text>
                </HStack>
              </Link>
            </Box>
          );
        })}
      </HStack>
    </Box>
  );
}
