"use client";

import { useRef, useState } from "react";
import { Box, HStack, Portal, Stack, Text } from "@chakra-ui/react";
import { EntityAvatar, type EntityAvatarSize, type EntityAvatarStatus } from "./EntityAvatar";

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * Avatar de USUÁRIO/equipe: foto (ou inicial colorida) com uma BORDA leve na cor
 * da equipe e, no hover, um POPOVER (via Portal — nunca cortado pelo overflow de
 * tabelas) ao lado, com a foto maior + nome + perfil + email + cargo. Componente
 * único usado em qualquer lugar que mostre uma pessoa do sistema.
 */
export function UserAvatar({
  name,
  image,
  color,
  funcao,
  email,
  perfil,
  size = "sm",
  status = "none",
  showTooltip = true,
}: {
  name: string;
  image?: string | null;
  color?: string | null;
  /** Cargo (ex.: "Escrevente"). */
  funcao?: string | null;
  /** E-mail do usuário (exibido no popover). */
  email?: string | null;
  /** Perfil de acesso (ex.: "Administrador") — exibido no popover. */
  perfil?: string | null;
  size?: EntityAvatarSize;
  status?: EntityAvatarStatus;
  /** Desliga o popover do hover. */
  showTooltip?: boolean;
}) {
  const ring = color && HEX.test(color) ? color : "#6366f1";
  // Fallback nativo (nunca cortado) — garante o nome no hover mesmo sem o popover.
  const title = [name, funcao, perfil, email].filter(Boolean).join(" · ");
  const ref = useRef<HTMLDivElement>(null);
  const [pop, setPop] = useState<{ left: number; top: number; flip: boolean } | null>(null);

  const avatarInner = (
    <Box
      borderRadius="full"
      p="2px"
      bg={`${ring}29`}
      boxShadow={`inset 0 0 0 1.5px ${ring}66`}
      display="inline-flex"
      flexShrink={0}
      lineHeight={0}
    >
      <EntityAvatar name={name} src={image} color={color} size={size} status={status} />
    </Box>
  );

  if (!showTooltip) {
    return (
      <Box display="inline-flex" flexShrink={0} title={title}>
        {avatarInner}
      </Box>
    );
  }

  function openPopover() {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    const r = el.getBoundingClientRect();
    const POP_W = 260;
    const flip = r.right + 12 + POP_W > window.innerWidth; // sem espaço à direita → abre à esquerda
    setPop({
      left: flip ? r.left - 12 : r.right + 12,
      top: r.top + r.height / 2,
      flip,
    });
  }

  return (
    <Box
      ref={ref}
      display="inline-flex"
      flexShrink={0}
      title={title}
      onMouseEnter={openPopover}
      onMouseLeave={() => setPop(null)}
    >
      {avatarInner}
      {pop ? (
        <Portal>
          <Box
            position="fixed"
            left={`${pop.left}px`}
            top={`${pop.top}px`}
            transform={pop.flip ? "translate(-100%, -50%)" : "translateY(-50%)"}
            bg="var(--admin-surface, #ffffff)"
            border="1px solid var(--admin-border, #e5e7eb)"
            borderRadius="14px"
            boxShadow="0 16px 44px rgba(15,23,42,0.24)"
            px={3}
            py={2.5}
            whiteSpace="nowrap"
            pointerEvents="none"
            zIndex={2000}
          >
            <HStack gap={3} align="center">
              <EntityAvatar name={name} src={image} color={color} size="lg" />
              <Stack gap={0.5} minW={0}>
                <Text fontSize="sm" fontWeight="700" lineHeight="1.2" color="var(--admin-text, #0f172a)">
                  {name}
                </Text>
                {funcao ? (
                  <Text fontSize="xs" lineHeight="1.3" color="var(--admin-text-soft, #64748b)">
                    {funcao}
                  </Text>
                ) : null}
                {perfil ? (
                  <Text
                    fontSize="10px"
                    fontWeight="700"
                    letterSpacing="0.04em"
                    textTransform="uppercase"
                    lineHeight="1.3"
                    color={ring}
                  >
                    {perfil}
                  </Text>
                ) : null}
                {email ? (
                  <Text fontSize="xs" lineHeight="1.3" color="var(--admin-text-soft, #64748b)">
                    {email}
                  </Text>
                ) : null}
              </Stack>
            </HStack>
          </Box>
        </Portal>
      ) : null}
    </Box>
  );
}
