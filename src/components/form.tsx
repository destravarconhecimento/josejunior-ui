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
  disabled,
  ...field
}: FieldWrap & {
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
} & React.ComponentProps<typeof NativeSelect.Field>) {
  return (
    <FormField label={label} help={help} error={error} required={required}>
      <NativeSelect.Root disabled={disabled}>
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
      // Barra flutuante que ACOMPANHA a largura do conteúdo (sem "fora a fora"):
      // cartão arredondado, alinhado à esquerda, sticky no rodapé — fica colado
      // enquanto a posição natural está fora da viewport e repousa ao chegar no fim.
      position="sticky"
      bottom={{ base: 3, md: 4 }}
      zIndex={20}
      mt={6}
      bg="var(--admin-surface)"
      borderWidth="1px"
      borderColor="var(--admin-border)"
      borderRadius="14px"
      boxShadow="0 12px 32px rgba(15,23,42,0.12)"
      backdropFilter="blur(10px)"
      px={{ base: 3, md: 4 }}
      py={3}
    >
      <HStack justify="flex-start" align="center" gap={3} flexWrap="wrap">
        <HStack gap={2} flexShrink={0}>
          {actions}
        </HStack>
        {loading ? (
          <HStack gap={2} px={3} py={1.5} borderRadius="full" bg="var(--admin-nav-active)" color="var(--admin-primary)">
            <Spinner size="sm" borderWidth="2px" color="var(--admin-primary)" />
            <Text fontSize="sm" fontWeight="600">
              {loadingLabel}
            </Text>
          </HStack>
        ) : null}
        {status}
      </HStack>
    </Box>
  );
}
