import type { ReactNode } from "react";
import { Box, HStack, Text, type BoxProps } from "@chakra-ui/react";

/** Card padrão (.admin-card). Com `title`/`actions` opcionais no topo. */
export function Card({
  title,
  actions,
  children,
  bodyProps,
  ...rest
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  bodyProps?: BoxProps;
} & BoxProps) {
  return (
    <Box className="admin-card" p={{ base: 5, md: 6 }} {...rest}>
      {title || actions ? (
        <HStack justify="space-between" align="center" mb={4} gap={3} flexWrap="wrap">
          {typeof title === "string" ? (
            <Text fontWeight="700" fontSize="md" color="var(--admin-primary)">
              {title}
            </Text>
          ) : (
            title
          )}
          {actions ? <HStack gap={2}>{actions}</HStack> : null}
        </HStack>
      ) : null}
      <Box {...bodyProps}>{children}</Box>
    </Box>
  );
}
