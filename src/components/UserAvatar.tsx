import { Box, Text } from "@chakra-ui/react";
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
      <Box
        position="absolute"
        bottom="calc(100% + 7px)"
        left="50%"
        transform="translateX(-50%)"
        opacity={0}
        visibility="hidden"
        _groupHover={{ opacity: 1, visibility: "visible" }}
        transition="opacity 0.12s ease"
        bg="#0f172a"
        color="white"
        px={2.5}
        py={1.5}
        borderRadius="8px"
        boxShadow="0 8px 24px rgba(15,23,42,0.28)"
        whiteSpace="nowrap"
        pointerEvents="none"
        zIndex={60}
        textAlign="center"
      >
        <Text fontSize="xs" fontWeight="700" lineHeight="1.25">
          {name}
        </Text>
        {funcao ? (
          <Text fontSize="10px" opacity={0.82} lineHeight="1.3">
            {funcao}
          </Text>
        ) : null}
        <Box
          position="absolute"
          top="100%"
          left="50%"
          transform="translateX(-50%)"
          w={0}
          h={0}
          borderLeft="4px solid transparent"
          borderRight="4px solid transparent"
          borderTop="4px solid #0f172a"
        />
      </Box>
    </Box>
  );
}
