"use client";
// Fica na PRIMEIRA linha: a diretiva tem que abrir o arquivo, e comentário antes
// dela já custou build neste repo. O porquê: o campo de cor guarda o que está
// sendo digitado (ver `FormColor`), e aqui vale a mesma regra do resto do ui —
// componente com estado declara a fronteira. Nada no monorepo monta um Form* de
// dentro de Server Component: todo uso já é client, porque todos passam `onChange`.

import { useState, type ReactNode } from "react";
import { Box, Field, HStack, SimpleGrid, Spinner, Text, chakra } from "@chakra-ui/react";
// Controles ui-owned (anti-autofill + estilo --admin embutidos). NÃO usar o
// Input/Textarea/NativeSelect CRU do Chakra aqui: eles não bloqueiam o autofill
// do navegador/gerenciador de senha e enchiam campos que deviam ficar vazios.
import { Input, type InputProps, NativeSelect, Textarea, type TextareaProps } from "./controls";

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

/**
 * Cor: a amostra clicável do navegador + o código escrito, lado a lado. Um só,
 * porque este par estava remontado à mão em cada tela que pede cor — e cada
 * cópia trazia a sua borda, o seu tamanho e o seu jeito de errar.
 *
 * O rascunho vive AQUI, e é o motivo de o campo ser um primitivo e não duas
 * tags soltas: o caminho até `#e98f03` passa por `#e9`, que não é cor nenhuma.
 * Quem só guarda cor válida (o fundo, p.ex.) devolveria o valor velho a cada
 * tecla e o campo andaria pra trás enquanto se digita. Então o meio do caminho
 * fica no campo e só o que o dono aceitou volta pra ele — `onChange` entrega o
 * texto cru e QUEM USA decide o que merece ser guardado.
 */
export function FormColor({
  label,
  help,
  error,
  required,
  value,
  onChange,
  ...input
}: FieldWrap & {
  value: string;
  onChange: (v: string) => void;
} & Omit<InputProps, "value" | "onChange">) {
  const [rascunho, setRascunho] = useState<string | null>(null);
  // A amostra nativa só entende `#rrggbb`. Com o campo vazio ou meio digitado
  // ela cairia no preto do navegador e ainda avisaria no console — mostramos o
  // preto de propósito, que é o que ela faria de qualquer jeito.
  const amostra = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";

  return (
    <FormField label={label} help={help} error={error} required={required}>
      <HStack gap={2} w="full">
        <chakra.input
          type="color"
          value={amostra}
          onChange={(e) => {
            setRascunho(null);
            onChange(e.target.value);
          }}
          aria-label={typeof label === "string" ? `${label}: escolher no seletor` : "Escolher a cor"}
          flexShrink={0}
          w="44px"
          h="40px"
          p={0}
          cursor="pointer"
          borderRadius="6px"
          borderWidth="1px"
          borderColor="var(--admin-border)"
          bg="transparent"
        />
        <Input
          bg="var(--admin-surface)"
          fontFamily="mono"
          fontSize="sm"
          value={rascunho ?? value}
          onChange={(e) => {
            setRascunho(e.target.value);
            onChange(e.target.value);
          }}
          onBlur={() => setRascunho(null)}
          {...input}
        />
      </HStack>
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
