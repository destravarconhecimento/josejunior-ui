"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Box, HStack, Menu, Portal, Stack, Text } from "@chakra-ui/react";
import { Bell } from "lucide-react";

export type NotificationTone = "info" | "atencao" | "critico";

export type NotificationItem = {
  id: string;
  /** Linha principal (ex.: "3 leads novos na captação"). */
  title: string;
  /** Apoio opcional (ex.: nome do lead, hora). */
  description?: string;
  /** Pra onde o "Ir para" leva. */
  href: string;
  tone?: NotificationTone;
  /** Ícone JÁ renderizado (o Server Component não passa função). */
  icon?: ReactNode;
};

const TONE_COLOR: Record<NotificationTone, string> = {
  info: "var(--admin-text-soft)",
  atencao: "#d97706",
  critico: "#dc2626",
};

/**
 * Sino da topbar: badge com o total e popover com as notificações.
 *
 * NÃO é o inbox de e-mail — e-mail tem o próprio atalho (`NavBadgeLink`). Aqui
 * entra o que exige AÇÃO em outra tela: atendimento em risco, lead novo,
 * candidatura de representante. Cada item leva pra tela dona do assunto.
 *
 * Sem fetch: os itens vêm prontos do layout (Server Component) e atualizam na
 * navegação — mesmo contrato do `NavBadgeLink`, e sem pôr um poll no topo de
 * todas as telas.
 */
export function NotificationBell({
  items,
  onDark = false,
  emptyLabel = "Nada pendente por aqui.",
}: {
  items: NotificationItem[];
  onDark?: boolean;
  emptyLabel?: string;
}) {
  const count = items.length;
  const shown = count > 99 ? "99+" : String(count);

  return (
    <Menu.Root positioning={{ placement: "bottom-end" }}>
      <Menu.Trigger asChild>
        <Box
          as="button"
          position="relative"
          display="inline-flex"
          flexShrink={0}
          aria-label={count > 0 ? `Notificações (${count})` : "Notificações"}
          title="Notificações"
        >
          <Box
            className={onDark ? undefined : "admin-navbtn"}
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            boxSize="34px"
            borderRadius="9px"
            color={onDark ? "white" : undefined}
            _hover={onDark ? { bg: "rgba(255,255,255,0.15)" } : undefined}
          >
            <Bell size={17} />
          </Box>
          {count > 0 ? (
            <Text
              position="absolute"
              top="-2px"
              right="-2px"
              minW="16px"
              h="16px"
              px="4px"
              borderRadius="full"
              bg="#dc2626"
              color="white"
              fontSize="9px"
              fontWeight="800"
              lineHeight="16px"
              textAlign="center"
              pointerEvents="none"
              style={onDark ? undefined : { boxShadow: "0 0 0 2px var(--admin-surface, #fff)" }}
            >
              {shown}
            </Text>
          ) : null}
        </Box>
      </Menu.Trigger>

      <Portal>
        <Menu.Positioner>
          <Menu.Content className="admin-dropdown" minW="320px" maxW="380px" p={2} borderRadius="14px">
            <Text px={2} pt={1} pb={2} fontSize="xs" fontWeight="700" color="var(--admin-text-soft)">
              Notificações
            </Text>

            {count === 0 ? (
              <Text px={2} pb={2} fontSize="sm" color="var(--admin-text-soft)">
                {emptyLabel}
              </Text>
            ) : (
              <Stack gap={0.5} maxH="60vh" overflowY="auto" className="admin-scroll">
                {items.map((n) => (
                  <Menu.Item key={n.id} value={n.id} asChild borderRadius="9px" p={0}>
                    <Link href={n.href}>
                      <HStack gap={2.5} align="flex-start" w="full" px={2} py={2}>
                        {n.icon ? (
                          <Box color={TONE_COLOR[n.tone ?? "info"]} mt="2px" flexShrink={0}>
                            {n.icon}
                          </Box>
                        ) : null}
                        <Box minW={0} flex="1">
                          <Text fontSize="sm" fontWeight="600" lineClamp={2}>
                            {n.title}
                          </Text>
                          {n.description ? (
                            <Text fontSize="xs" color="var(--admin-text-soft)" lineClamp={1}>
                              {n.description}
                            </Text>
                          ) : null}
                        </Box>
                        <Text fontSize="xs" fontWeight="700" color="var(--admin-primary)" flexShrink={0} mt="2px">
                          Ir para
                        </Text>
                      </HStack>
                    </Link>
                  </Menu.Item>
                ))}
              </Stack>
            )}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
