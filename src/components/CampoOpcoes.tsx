"use client";

import { Flex } from "../primitives";
import { chakra } from "../chakra-controls";
import { Field } from "./controls";

/**
 * Marcação e grupo de opções NATIVOS (`<input type="checkbox">` estilizado).
 *
 * Por que não o `Checkbox` do Chakra: ele desenha um `div` e esconde o input
 * real, e num formulário de envio por POST isso custa duas coisas — o valor não
 * entra no `FormData` sozinho e o teste de ponta a ponta não consegue clicar no
 * que vê. Aqui o input É o controle: `name`/`value` chegam ao servidor, o
 * Playwright clica nele, e o estilo é uma linha (`accentColor`).
 */
const CAIXA = {
  boxSize: "4",
  flexShrink: 0,
  cursor: "pointer",
  css: { accentColor: "var(--admin-primary)" },
} as const;

/** Uma marcação só, com rótulo clicável ao lado. */
export function CampoMarcacao({
  name,
  rotulo,
  hint,
  marcado = false,
  value = "1",
  testId,
}: {
  name: string;
  rotulo: string;
  hint?: string;
  marcado?: boolean;
  value?: string;
  testId?: string;
}) {
  return (
    <Field.Root>
      <chakra.label display="inline-flex" alignItems="center" gap="2" fontSize="sm" cursor="pointer">
        <chakra.input
          type="checkbox"
          name={name}
          value={value}
          defaultChecked={marcado}
          data-testid={testId ?? `campo-${name}`}
          {...CAIXA}
        />
        {rotulo}
      </chakra.label>
      {hint && <Field.HelperText>{hint}</Field.HelperText>}
    </Field.Root>
  );
}

/** Grupo de marcações com o MESMO `name` — o envio recebe a lista marcada. */
export function CampoOpcoes({
  name,
  rotulo,
  opcoes,
  marcadas,
  hint,
}: {
  name: string;
  rotulo: string;
  opcoes: { value: string; label: string }[];
  marcadas?: string[];
  hint?: string;
}) {
  return (
    <Field.Root>
      <Field.Label>{rotulo}</Field.Label>
      <Flex gap="3" wrap="wrap">
        {opcoes.map((o) => (
          <chakra.label
            key={o.value}
            display="inline-flex"
            alignItems="center"
            gap="2"
            fontSize="sm"
            cursor="pointer"
          >
            <chakra.input
              type="checkbox"
              name={name}
              value={o.value}
              defaultChecked={marcadas?.includes(o.value) ?? false}
              data-testid={`campo-${name}-${o.value}`}
              {...CAIXA}
            />
            {o.label}
          </chakra.label>
        ))}
      </Flex>
      {hint && <Field.HelperText>{hint}</Field.HelperText>}
    </Field.Root>
  );
}
