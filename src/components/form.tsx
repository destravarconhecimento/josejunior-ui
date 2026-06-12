import type { ReactNode } from "react";
import {
  Box,
  Field,
  HStack,
  Input,
  type InputProps,
  NativeSelect,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  type TextareaProps,
} from "@chakra-ui/react";

type FieldWrap = { label?: ReactNode; help?: ReactNode; error?: ReactNode; required?: boolean };

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

/** Input com label/erro padrão (FormField + Input). */
export function FormInput({ label, help, error, required, ...input }: FieldWrap & InputProps) {
  return (
    <FormField label={label} help={help} error={error} required={required}>
      <Input bg="var(--admin-surface)" {...input} />
    </FormField>
  );
}

/** Textarea com label/erro padrão. */
export function FormTextarea({ label, help, error, required, ...ta }: FieldWrap & TextareaProps) {
  return (
    <FormField label={label} help={help} error={error} required={required}>
      <Textarea bg="var(--admin-surface)" {...ta} />
    </FormField>
  );
}

/** Select nativo com label/erro padrão. `options` = [{value,label}]. */
export function FormSelect({
  label,
  help,
  error,
  required,
  options,
  placeholder,
  ...field
}: FieldWrap & {
  options: { value: string; label: string }[];
  placeholder?: string;
} & React.ComponentProps<typeof NativeSelect.Field>) {
  return (
    <FormField label={label} help={help} error={error} required={required}>
      <NativeSelect.Root>
        <NativeSelect.Field bg="var(--admin-surface)" {...field}>
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </FormField>
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
      // Barra "fora a fora": branca, sem cantos, sombra no topo. Sticky no
      // desktop (estoura o padding do main via margem negativa); fixa na
      // viewport no mobile. Sempre colada no rodapé.
      position={{ base: "fixed", md: "sticky" }}
      left={{ base: 0, md: "auto" }}
      right={{ base: 0, md: "auto" }}
      bottom={0}
      zIndex={30}
      mt={{ base: 0, md: 8 }}
      mx={{ base: 0, md: -6 }}
      bg="var(--admin-surface)"
      borderTopWidth="1px"
      borderColor="var(--admin-border)"
      boxShadow="0 -10px 30px rgba(0,0,0,0.07)"
      backdropFilter="blur(12px)"
    >
      <HStack
        justify="space-between"
        align="center"
        gap={4}
        maxW="1600px"
        mx="auto"
        px={{ base: 4, md: 6 }}
        py={3}
      >
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
