import type { ReactNode } from "react";
import { Box, Field, HStack, SimpleGrid, Spinner, Text } from "@chakra-ui/react";

/** Campo de formulário padrão: label + controle + ajuda/erro. */
export function FormField({
  label,
  help,
  error,
  required,
  children,
  ...rest
}: {
  label?: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
} & Omit<Field.RootProps, "children">) {
  return (
    <Field.Root required={required} invalid={Boolean(error)} {...rest}>
      {label ? (
        <Field.Label fontWeight="600" fontSize="sm" color="var(--admin-primary)">
          {label}
          {required ? <Field.RequiredIndicator /> : null}
        </Field.Label>
      ) : null}
      {children}
      {error ? (
        <Field.ErrorText>{error}</Field.ErrorText>
      ) : help ? (
        <Field.HelperText fontSize="xs">{help}</Field.HelperText>
      ) : null}
    </Field.Root>
  );
}

/** Grid responsivo p/ campos (1 col mobile, N no desktop). */
export function FormGrid({
  columns = 2,
  children,
}: {
  columns?: number;
  children: ReactNode;
}) {
  return (
    <SimpleGrid columns={{ base: 1, md: columns }} gap={4}>
      {children}
    </SimpleGrid>
  );
}

/** Barra de ações fixa no rodapé (salvar/cancelar + status). */
export function FormActions({
  status,
  actions,
  loading = false,
  loadingLabel = "Salvando alterações...",
}: {
  status?: ReactNode;
  actions: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
}) {
  return (
    <Box
      // Mobile: fixa no rodapé da viewport (sempre visível). Desktop: sticky no fluxo.
      position={{ base: "fixed", md: "sticky" }}
      left={{ base: 0, md: "auto" }}
      right={{ base: 0, md: "auto" }}
      bottom={0}
      zIndex={30}
      px={{ base: 3, md: 0 }}
      pt={{ base: 3, md: 6 }}
      pb={{ base: 3, md: 4 }}
      mt={{ base: 0, md: 8 }}
      bg="linear-gradient(180deg, transparent 0%, var(--admin-surface-2) 30%)"
      backdropFilter="blur(10px)"
    >
      <HStack className="admin-card" justify="space-between" align="center" gap={4} px={{ base: 4, md: 6 }} py={3}>
        <HStack gap={4} flex="1" minW={0} flexWrap="wrap">
          {loading ? (
            <HStack gap={2} px={3} py={2} borderRadius="full" bg="var(--admin-nav-active)" color="var(--admin-primary)">
              <Spinner size="sm" borderWidth="2px" color="var(--admin-primary)" />
              <Text fontSize="sm" fontWeight="600">
                {loadingLabel}
              </Text>
            </HStack>
          ) : null}
          {status}
        </HStack>
        <HStack gap={2} justify="flex-end" flexShrink={0}>
          {actions}
        </HStack>
      </HStack>
    </Box>
  );
}
