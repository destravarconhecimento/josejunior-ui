"use client";

import { useState, type ReactNode } from "react";
import { Box, HStack, NativeSelect, Stack, Text } from "@chakra-ui/react";
import { PageHeader } from "./PageHeader";

export type SideTabItem = { value: string; label: string; badge?: ReactNode };
export type SideTabGroup = { title?: string; items: SideTabItem[] };

/**
 * Tela com SUB-MENU LATERAL (abas verticais): `PageHeader` (título + ações) e,
 * abaixo, uma navegação vertical à esquerda — opcionalmente agrupada — com o
 * painel ativo à direita, um por vez. No mobile a lista vira dropdown. Os
 * painéis chegam prontos (podem vir do server); só o ativo é montado.
 */
export function PageSideTabs({
  title,
  actions,
  groups,
  panels,
  defaultValue,
}: {
  title: string;
  actions?: ReactNode;
  groups: SideTabGroup[];
  panels: Record<string, ReactNode>;
  defaultValue?: string;
}) {
  const flat = groups.flatMap((g) => g.items);
  const [tab, setTab] = useState(defaultValue ?? flat[0]?.value ?? "");

  return (
    <>
      <PageHeader title={title} actions={actions} />
      <Box
        display="flex"
        flexDirection={{ base: "column", md: "row" }}
        gap={{ base: 4, md: 6 }}
        alignItems="flex-start"
      >
        {/* Mobile: dropdown com a seção atual */}
        <Box display={{ base: "block", md: "none" }} w="full">
          <Text
            fontSize="10px"
            fontWeight="700"
            textTransform="uppercase"
            letterSpacing="1.4px"
            color="var(--admin-text-soft)"
            mb={1.5}
          >
            Seção
          </Text>
          <NativeSelect.Root size="lg">
            <NativeSelect.Field
              value={tab}
              onChange={(e) => setTab(e.currentTarget.value)}
              bg="var(--admin-surface)"
              borderColor="var(--admin-border)"
              borderRadius="12px"
              fontWeight="600"
              color="var(--admin-primary)"
              h="48px"
            >
              {flat.map((it) => (
                <option key={it.value} value={it.value}>
                  {it.label}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator color="var(--admin-primary)" />
          </NativeSelect.Root>
        </Box>

        {/* Desktop: sub-nav vertical (agrupada e sticky) */}
        <Stack
          display={{ base: "none", md: "flex" }}
          flexShrink={0}
          gap={3}
          p={2}
          w="244px"
          bg="var(--admin-card)"
          border="1px solid var(--admin-border)"
          borderRadius="14px"
          position="sticky"
          top="16px"
          maxH="calc(100vh - 32px)"
          overflowY="auto"
        >
          {groups.map((g, gi) => (
            <Stack key={gi} gap={1}>
              {g.title && (
                <Text
                  px={2}
                  pt={gi === 0 ? 1 : 2}
                  fontSize="10px"
                  fontWeight="700"
                  textTransform="uppercase"
                  letterSpacing="1.2px"
                  color="var(--admin-text-soft)"
                >
                  {g.title}
                </Text>
              )}
              {g.items.map((it) => {
                const active = it.value === tab;
                return (
                  <HStack
                    as="button"
                    key={it.value}
                    onClick={() => setTab(it.value)}
                    justify="space-between"
                    w="full"
                    textAlign="left"
                    px={3}
                    py={2}
                    borderRadius="9px"
                    fontSize="sm"
                    fontWeight="600"
                    bg={active ? "var(--admin-primary)" : "transparent"}
                    color={active ? "white" : "var(--admin-text)"}
                    _hover={active ? {} : { bg: "var(--admin-surface)" }}
                    transition="background .14s ease, color .14s ease"
                  >
                    <Box as="span" minW={0} lineClamp={1}>
                      {it.label}
                    </Box>
                    {it.badge != null && <Box as="span">{it.badge}</Box>}
                  </HStack>
                );
              })}
            </Stack>
          ))}
        </Stack>

        {/* Painel ativo */}
        <Box flex="1" minW={0} w="full">
          {panels[tab] ?? null}
        </Box>
      </Box>
    </>
  );
}
