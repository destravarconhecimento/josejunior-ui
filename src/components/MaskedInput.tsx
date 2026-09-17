"use client";

import { useState } from "react";
import { Input } from "./controls";

/**
 * Input MASCARADO que envia o valor CRU.
 *
 * O problema que ele resolve não é o desenho da máscara — é o envio. Um campo
 * de CPF mascarado manda "123.456.789-09" para o servidor, e aí cada rota
 * precisa lembrar de tirar os pontos. Aqui o input visível é só aparência
 * (sem `name`) e quem carrega o `name` é um `<input type="hidden">` com os
 * dígitos: o `FormData` recebe sempre o valor limpo, em toda tela.
 *
 * As máscaras NÃO moram aqui de propósito. Cada sistema tem as suas e as usa
 * também no servidor (validar, gravar, imprimir etiqueta) — duplicar a regra no
 * design-system criaria uma segunda verdade. Quem chama injeta as duas funções.
 */
export function MaskedInput({
  name,
  formatar,
  crua,
  defaultValue = "",
  placeholder,
  size = "md",
  ...rest
}: {
  name: string;
  /** Texto digitado → texto exibido ("12345678909" → "123.456.789-09"). */
  formatar: (texto: string) => string;
  /** Texto exibido → valor que vai no envio ("123.456.789-09" → "12345678909"). */
  crua: (texto: string) => string;
  defaultValue?: string;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
} & Record<string, unknown>) {
  const [display, setDisplay] = useState(() => formatar(defaultValue));
  return (
    <>
      <Input
        value={display}
        onChange={(e) => setDisplay(formatar(e.currentTarget.value))}
        placeholder={placeholder}
        inputMode="numeric"
        autoComplete="off"
        size={size}
        {...rest}
      />
      <input type="hidden" name={name} value={crua(display)} />
    </>
  );
}
