import type { ReactNode } from "react";
import { Box, Icon, Stack, Text } from "@chakra-ui/react";
import type { LucideIcon } from "lucide-react";

/** Estado vazio padrão: ícone + título + texto + ação opcional. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Stack align="center" textAlign="center" gap={3} py={{ base: 10, md: 14 }} px={6}>
      {icon ? (
        <Box
          w="52px"
          h="52px"
          borderRadius="14px"
          bg="var(--admin-nav-hover)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="var(--admin-primary)"
        >
          <Icon as={icon} boxSize={6} />
        </Box>
      ) : null}
      <Text fontWeight="700" fontSize="lg" color="var(--admin-primary)">
        {title}
      </Text>
      {description ? (
        <Text color="var(--admin-text-soft)" fontSize="sm" maxW="440px" lineHeight="1.7">
          {description}
        </Text>
      ) : null}
      {action}
    </Stack>
  );
}
