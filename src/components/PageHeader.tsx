import type { ReactNode } from "react";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";

/** Cabeçalho padrão de página: eyebrow + título + descrição + ações à direita. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Stack
      direction={{ base: "column", sm: "row" }}
      justify="space-between"
      align={{ base: "flex-start", sm: "flex-end" }}
      gap={4}
      mb={6}
    >
      <Box minW={0}>
        {eyebrow ? (
          <Text
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="2px"
            fontWeight="700"
            color="var(--admin-accent)"
            mb={1}
          >
            {eyebrow}
          </Text>
        ) : null}
        <Text
          as="h1"
          className="admin-h"
          fontSize={{ base: "24px", md: "30px" }}
          lineHeight="1.1"
          fontWeight="700"
          color="var(--admin-primary)"
        >
          {title}
        </Text>
        {description ? (
          <Text color="var(--admin-text-soft)" fontSize="sm" mt={1.5} maxW="680px">
            {description}
          </Text>
        ) : null}
      </Box>
      {actions ? (
        <HStack gap={2} flexShrink={0} flexWrap="wrap">
          {actions}
        </HStack>
      ) : null}
    </Stack>
  );
}
