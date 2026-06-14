import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { EntityAvatar, type EntityAvatarSize, type EntityAvatarStatus } from "./EntityAvatar";

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * Avatar de USUÁRIO/equipe: foto (ou inicial colorida) com uma BORDA leve na cor
 * da equipe e, no hover, um POPOVER ao lado com a foto maior + nome + perfil +
 * email + cargo. Componente único usado em qualquer lugar que mostre uma pessoa
 * do sistema (responsável, autor, membro…). A foto vem de `users.image`; a cor,
 * de `users.color`.
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
  // Fallback nativo (nunca é cortado por overflow) — garante o nome no hover
  // mesmo onde o popover bonito não couber.
  const title = [name, funcao, perfil, email].filter(Boolean).join(" · ");
  const avatar = (
    <Box
      borderRadius="full"
      p="2px"
      bg={`${ring}29`}
      boxShadow={`inset 0 0 0 1.5px ${ring}66`}
      display="inline-flex"
      flexShrink={0}
      lineHeight={0}
      title={title}
    >
      <EntityAvatar name={name} src={image} color={color} size={size} status={status} />
    </Box>
  );
  if (!showTooltip) return avatar;
  return (
    <Box role="group" position="relative" display="inline-flex" flexShrink={0}>
      {avatar}
      {/* Popover ao lado (direita): foto maior + nome + perfil + email + cargo. */}
      <Box
        position="absolute"
        top="50%"
        left="calc(100% + 10px)"
        transform="translateY(-50%) translateX(-4px)"
        opacity={0}
        visibility="hidden"
        _groupHover={{ opacity: 1, visibility: "visible", transform: "translateY(-50%) translateX(0)" }}
        transition="opacity 0.14s ease, transform 0.14s ease"
        bg="var(--admin-surface, #ffffff)"
        border="1px solid var(--admin-border, #e5e7eb)"
        borderRadius="14px"
        boxShadow="0 14px 40px rgba(15,23,42,0.22)"
        px={3}
        py={2.5}
        whiteSpace="nowrap"
        pointerEvents="none"
        zIndex={70}
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
        {/* seta apontando p/ a esquerda (pro avatar) */}
        <Box
          position="absolute"
          top="50%"
          right="100%"
          transform="translateY(-50%)"
          w={0}
          h={0}
          borderTop="6px solid transparent"
          borderBottom="6px solid transparent"
          borderRight="7px solid var(--admin-surface, #ffffff)"
          filter="drop-shadow(-2px 0 1px rgba(15,23,42,0.06))"
        />
      </Box>
    </Box>
  );
}
