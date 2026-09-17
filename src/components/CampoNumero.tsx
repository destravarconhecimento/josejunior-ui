"use client";

import { Flex, Text } from "../primitives";
import { Field } from "./controls";
import { Input } from "./controls";

/**
 * A REGRA DO CAMPO NUMÉRICO — o que o texto digitado vira. Fica separada do
 * desenho porque é ela que tem teste:
 *
 *  · vazio → `null` quando o campo é nulável ("sem limite"), senão o piso
 *    (`min`) ou zero — nunca `NaN`;
 *  · vírgula vale como ponto: o teclado brasileiro digita "7,5";
 *  · lixo ("abc") não muda nada: devolve `undefined` e o chamador ignora — sem
 *    isso o campo apaga o que a pessoa já tinha digitado ao primeiro engano.
 */
export function lerNumero(
  texto: string,
  opts: { nulavel?: boolean; min?: number },
): number | null | undefined {
  const s = texto.trim();
  if (!s) return opts.nulavel ? null : (opts.min ?? 0);
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Campo numérico com vírgula, piso e "sem limite" (nulável). O `<Input
 * type="number">` cru não dá conta de nenhum dos três: ele rejeita a vírgula em
 * teclado pt-BR, devolve `NaN` no vazio e não sabe dizer "nulo".
 *
 * Sem `label` ele é só o controle — para viver dentro de uma célula de tabela
 * ou ao lado de outro campo.
 */
export function CampoNumero({
  label,
  hint,
  valor,
  aoMudar,
  min,
  max,
  step,
  desabilitado = false,
  nulavel = false,
  sufixo,
  size = "sm",
  name,
  larguraMax = "32",
}: {
  label?: string;
  hint?: string;
  valor: number | null;
  aoMudar: (v: number | null) => void;
  min?: number;
  max?: number;
  step?: number | "any";
  desabilitado?: boolean;
  /** Vazio vale como "sem limite" e devolve `null` em vez do piso. */
  nulavel?: boolean;
  /** Unidade à direita do controle ("dias", "%", "kg"). */
  sufixo?: string;
  size?: "xs" | "sm" | "md";
  name?: string;
  larguraMax?: string;
}) {
  const controle = (
    <Flex align="center" gap="2">
      <Input
        size={size}
        type="number"
        inputMode="decimal"
        name={name}
        value={valor === null ? "" : String(valor)}
        min={min}
        max={max}
        step={step}
        disabled={desabilitado}
        maxW={larguraMax}
        onChange={(e) => {
          const n = lerNumero(e.target.value, { nulavel, min });
          if (n !== undefined) aoMudar(n);
        }}
      />
      {sufixo && (
        <Text fontSize="xs" color="fg.muted" flexShrink="0">
          {sufixo}
        </Text>
      )}
    </Flex>
  );
  if (!label) return controle;
  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      {controle}
      {hint && <Field.HelperText>{hint}</Field.HelperText>}
    </Field.Root>
  );
}
