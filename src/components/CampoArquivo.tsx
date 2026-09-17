"use client";

import { Field, Input } from "./controls";

/**
 * Campo de ARQUIVO. Fica aqui, e não como um `FormInput type="file"`, por causa
 * do `aoMudar`: o valor de um input de arquivo não é texto, é `FileList` — quem
 * usa quer `File[]` na mão para pré-visualizar antes do envio.
 *
 * Para fila de upload com progresso e cancelar, o componente é outro.
 */
export function CampoArquivo({
  name,
  label,
  accept,
  multiple = false,
  desabilitado = false,
  aoMudar,
  testId,
  size = "sm",
  maxW,
}: {
  name: string;
  label?: string;
  accept?: string;
  multiple?: boolean;
  desabilitado?: boolean;
  aoMudar?: (arquivos: File[]) => void;
  testId?: string;
  size?: "xs" | "sm" | "md";
  maxW?: string;
}) {
  return (
    <Field.Root maxW={maxW}>
      {label && <Field.Label>{label}</Field.Label>}
      <Input
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        disabled={desabilitado}
        size={size}
        data-testid={testId}
        onChange={aoMudar ? (e) => aoMudar(Array.from(e.currentTarget.files ?? [])) : undefined}
      />
    </Field.Root>
  );
}
