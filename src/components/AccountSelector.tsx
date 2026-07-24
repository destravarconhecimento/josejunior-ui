"use client";

import { useState, type ReactNode } from "react";
import { Box, HStack, Popover, Portal, Stack, Text } from "@chakra-ui/react";
import { Check, ChevronDown, Layers } from "lucide-react";
import { EntityAvatar } from "./EntityAvatar";

export type AccountSelectorOption = {
  /** Id único = valor do seletor. */
  id: string;
  /** Linha principal (ex.: endereço de e-mail / nome da Página). */
  label: string;
  /** Linha de apoio, menor (ex.: @usuario do IG, provedor). */
  sublabel?: string;
  /** Contador do badge (não-lidas, posts…). 0/undefined = sem badge. */
  count?: number;
  /** Avatar: url da imagem (cai nas iniciais do nome quando ausente). */
  avatarSrc?: string | null;
  /** Nome p/ iniciais + cor do avatar (padrão: `label`). */
  avatarName?: string;
  /** Marca a conta principal com ★. */
  starred?: boolean;
};

/** Badge numérico — MESMO desenho do FolderButton/FilterBar (primária, branco). */
function CountPill({ n }: { n: number }) {
  return (
    <Box
      flexShrink={0}
      minW="18px"
      h="18px"
      px="5px"
      borderRadius="full"
      bg="var(--admin-primary)"
      color="white"
      fontSize="10px"
      fontWeight="700"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      {n > 99 ? "99+" : n}
    </Box>
  );
}

/** Círculo com ícone (a opção "Todas" não tem avatar de conta). */
function AllIcon({ box, icon }: { box: string; icon: number }) {
  return (
    <Box
      w={box}
      h={box}
      flexShrink={0}
      borderRadius="full"
      bg="var(--admin-surface-2)"
      color="var(--admin-primary)"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Layers size={icon} />
    </Box>
  );
}

function Row({
  active,
  onClick,
  leading,
  label,
  sublabel,
  starred,
  count,
}: {
  active: boolean;
  onClick: () => void;
  leading: ReactNode;
  label: string;
  sublabel?: string;
  starred?: boolean;
  count?: number;
}) {
  return (
    <HStack
      as="button"
      onClick={onClick}
      w="100%"
      gap={2.5}
      px={2}
      py="7px"
      borderRadius="10px"
      textAlign="left"
      bg={active ? "var(--admin-nav-active)" : "transparent"}
      _hover={{ bg: active ? "var(--admin-nav-active)" : "var(--admin-nav-hover)" }}
      cursor="pointer"
    >
      {leading}
      <Stack gap={0} flex="1" minW={0}>
        <Text fontSize="sm" fontWeight={active ? "700" : "600"} color="var(--admin-text)" lineClamp={1}>
          {starred ? "★ " : ""}
          {label}
        </Text>
        {sublabel ? (
          <Text fontSize="11px" color="var(--admin-text-soft)" lineClamp={1}>
            {sublabel}
          </Text>
        ) : null}
      </Stack>
      {count ? <CountPill n={count} /> : null}
      {active ? (
        <Box color="var(--admin-primary)" flexShrink={0}>
          <Check size={16} />
        </Box>
      ) : null}
    </HStack>
  );
}

/**
 * Seletor de contas das telas de Comunicação (e-mail, redes sociais…). Botão
 * compacto com avatar + rótulo + badge de contagem que abre um POPOVER com a
 * lista de contas (cada uma com seu badge) e a opção "Todas". É o upgrade do
 * `FormSelect` que ficava no `titleAfter` do e-mail — vive no MESMO lugar.
 *
 * - `value` = id selecionado (ou `allValue` quando em "Todas").
 * - Com 1 conta e sem "Todas", vira um rótulo estático (não há o que escolher).
 * - O popover porta pro `<body>` (z-index 1500) → não é cortado dentro de
 *   Modal/tabela, igual ao `MonthPicker`.
 */
export function AccountSelector({
  value,
  onChange,
  options,
  allValue = "__all__",
  allLabel = "Todas as contas",
  showAll,
  allCount,
}: {
  value: string;
  onChange: (id: string) => void;
  options: AccountSelectorOption[];
  /** Valor sentinela do "Todas" (e-mail usa "__all__", social usa "todas"). */
  allValue?: string;
  allLabel?: string;
  /** Mostra a opção "Todas". Padrão: há mais de uma conta. */
  showAll?: boolean;
  /** Badge do "Todas" (padrão: soma dos counts das contas). */
  allCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const withAll = showAll ?? options.length > 1;
  const total = allCount ?? options.reduce((s, o) => s + (o.count ?? 0), 0);

  // Mono: 1 conta e sem "Todas" → rótulo estático (nada pra escolher).
  if (!withAll && options.length <= 1) {
    const only = options[0];
    if (!only) return null;
    return (
      <HStack gap={2} minW={0} maxW={{ base: "200px", md: "320px" }}>
        <EntityAvatar name={only.avatarName ?? only.label} src={only.avatarSrc} size="xs" />
        <Text
          fontSize="sm"
          fontWeight="600"
          color="var(--admin-text-soft)"
          truncate
          title={only.label}
        >
          {only.starred ? "★ " : ""}
          {only.label}
        </Text>
      </HStack>
    );
  }

  const isAll = value === allValue;
  const current = isAll ? null : options.find((o) => o.id === value) ?? null;
  const triggerLabel = current?.label ?? allLabel;
  const triggerCount = isAll ? total : current?.count ?? 0;

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      positioning={{ placement: "bottom-start" }}
    >
      <Popover.Trigger asChild>
        <HStack
          as="button"
          aria-label="Selecionar conta"
          gap={2}
          h="34px"
          px={2.5}
          minW={{ base: "150px", md: "200px" }}
          maxW={{ base: "62vw", md: "340px" }}
          justify="space-between"
          borderWidth="1px"
          borderColor="var(--admin-border)"
          borderRadius="10px"
          bg="var(--admin-surface)"
          _hover={{ borderColor: "var(--admin-primary)" }}
          cursor="pointer"
        >
          <HStack gap={2} minW={0}>
            {isAll ? (
              <AllIcon box="24px" icon={14} />
            ) : (
              <EntityAvatar name={current?.avatarName ?? current?.label ?? "?"} src={current?.avatarSrc} size="xs" />
            )}
            <Text fontSize="sm" fontWeight="600" lineClamp={1} minW={0}>
              {current?.starred ? "★ " : ""}
              {triggerLabel}
            </Text>
          </HStack>
          <HStack gap={1.5} flexShrink={0}>
            {triggerCount ? <CountPill n={triggerCount} /> : null}
            <Box color="var(--admin-text-soft)">
              <ChevronDown size={15} />
            </Box>
          </HStack>
        </HStack>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content className="admin-dropdown" w="300px" maxW="88vw" p={2} borderRadius="14px">
            <Stack gap="2px" maxH="min(60vh, 420px)" overflowY="auto">
              {withAll ? (
                <Row
                  active={isAll}
                  onClick={() => pick(allValue)}
                  leading={<AllIcon box="34px" icon={16} />}
                  label={allLabel}
                  sublabel={`${options.length} ${options.length === 1 ? "conta" : "contas"}`}
                  count={total}
                />
              ) : null}
              {withAll && options.length ? (
                <Box h="1px" bg="var(--admin-border)" my={1} mx={1} />
              ) : null}
              {options.map((o) => (
                <Row
                  key={o.id}
                  active={!isAll && o.id === value}
                  onClick={() => pick(o.id)}
                  leading={<EntityAvatar name={o.avatarName ?? o.label} src={o.avatarSrc} size="sm" />}
                  label={o.label}
                  sublabel={o.sublabel}
                  starred={o.starred}
                  count={o.count ?? 0}
                />
              ))}
            </Stack>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
