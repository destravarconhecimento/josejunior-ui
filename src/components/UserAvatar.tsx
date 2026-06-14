import { Box, HStack, Text } from "@chakra-ui/react";
import { EntityAvatar, type EntityAvatarSize, type EntityAvatarStatus } from "./EntityAvatar";

/**
 * Avatar de USUÁRIO/equipe: foto (ou inicial colorida) + tooltip no hover com o
 * nome e o cargo. Use em qualquer lugar que mostre uma pessoa do sistema
 * (responsável, autor, membro…). A foto vem de `users.image`; a cor, de
 * `users.color`. Reaproveita o `EntityAvatar` para o círculo.
 */
export function UserAvatar({
  name,
  image,
  color,
  funcao,
  size = "sm",
  status = "none",
  showTooltip = true,
}: {
  name: string;
  image?: string | null;
  color?: string | null;
  /** Cargo exibido na segunda linha do tooltip. */
  funcao?: string | null;
  size?: EntityAvatarSize;
  status?: EntityAvatarStatus;
  /** Desliga o tooltip (ex.: quando o nome já aparece ao lado). */
  showTooltip?: boolean;
}) {
  const avatar = <EntityAvatar name={name} src={image} color={color} size={size} status={status} />;
  if (!showTooltip) return avatar;
  return (
    <Box role="group" position="relative" display="inline-flex" flexShrink={0}>
      {avatar}
      {/* Cartão de hover: foto (maior) + nome + cargo. */}
      <Box
        position="absolute"
        bottom="calc(100% + 9px)"
        left="50%"
        transform="translateX(-50%) translateY(4px)"
        opacity={0}
        visibility="hidden"
        _groupHover={{ opacity: 1, visibility: "visible", transform: "translateX(-50%) translateY(0)" }}
        transition="opacity 0.14s ease, transform 0.14s ease"
        bg="var(--admin-surface, #ffffff)"
        border="1px solid var(--admin-border, #e5e7eb)"
        borderRadius="14px"
        boxShadow="0 14px 38px rgba(15,23,42,0.20)"
        px={3}
        py={2.5}
        whiteSpace="nowrap"
        pointerEvents="none"
        zIndex={70}
      >
        <HStack gap={2.5} align="center">
          <EntityAvatar name={name} src={image} color={color} size="md" />
          <Box textAlign="left">
            <Text fontSize="sm" fontWeight="700" lineHeight="1.25" color="var(--admin-text, #0f172a)">
              {name}
            </Text>
            {funcao ? (
              <Text fontSize="xs" lineHeight="1.35" color="var(--admin-text-soft, #64748b)">
                {funcao}
              </Text>
            ) : null}
          </Box>
        </HStack>
        {/* seta */}
        <Box
          position="absolute"
          top="100%"
          left="50%"
          transform="translateX(-50%)"
          w={0}
          h={0}
          borderLeft="6px solid transparent"
          borderRight="6px solid transparent"
          borderTop="7px solid var(--admin-surface, #ffffff)"
          filter="drop-shadow(0 2px 1px rgba(15,23,42,0.08))"
        />
      </Box>
    </Box>
  );
}
