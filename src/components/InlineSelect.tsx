"use client";

import type { ReactNode } from "react";
import { Box } from "@chakra-ui/react";

export type InlineSelectOption = { value: string; label: string };

/**
 * Edição rápida em célula de tabela: mostra um gatilho (ex.: StatusBadge) e, ao
 * clicar, abre o select nativo sobreposto (invisível) para trocar o valor — sem
 * abrir o drawer. `render` desenha o gatilho a partir do valor atual.
 */
export function InlineSelect({
  value,
  options,
  onChange,
  render,
  disabled,
}: {
  value: string | null;
  options: InlineSelectOption[];
  onChange: (value: string) => void;
  render: (value: string | null) => ReactNode;
  disabled?: boolean;
}) {
  return (
    <Box position="relative" display="inline-flex" cursor={disabled ? "default" : "pointer"}>
      {render(value)}
      {disabled ? null : (
        <select
          value={value ?? ""}
          aria-label="Alterar status"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const v = e.target.value;
            if (v && v !== value) onChange(v);
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
            border: 0,
            padding: 0,
            margin: 0,
            appearance: "none",
          }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Box>
  );
}
