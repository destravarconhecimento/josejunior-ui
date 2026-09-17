"use client";

import { useRef, useState, type ReactNode } from "react";
import { Box, Stack } from "../../primitives";
import { Button } from "../Button";
import { Modal, type Degrau, type Tom } from "../Modal";
import { CamposDoFormulario } from "./Formulario";
import { useEnvioDeFormulario, type AcaoDeFormulario, type EstadoDoFormulario } from "./envio";
import type { CampoSpec } from "./Campo";
import { useUiTextos } from "../../provider/textos";

/**
 * Formulário em DIÁLOGO — o "novo", o "editar", o "convidar". A mesma lista de
 * `campos` do `<Formulario>`, o mesmo motor de envio, o mesmo toast.
 *
 * Duas coisas que ele resolve e que a tela sempre errava sozinha:
 *
 * · **o diálogo fecha no SUCESSO, e só nele.** Fechar no clique perde o erro (a
 *   pessoa não vê o que deu errado e o que digitou já foi embora); não fechar
 *   nunca deixa o diálogo aberto por cima da lista já atualizada.
 * · **o botão do rodapé envia o formulário do corpo.** Aqui isso sai de graça
 *   porque o `Modal` embrulha o diálogo INTEIRO num `<form display:contents>` —
 *   é a razão de o `form` ser prop dele e não um elemento que a tela escreve.
 *
 * Reabrir depois de salvar mostra o formulário limpo: além do `reset()`,
 * trocamos a `key`, porque `reset` não zera campo controlado por estado.
 */
export function FormDialog<E extends EstadoDoFormulario = EstadoDoFormulario>({
  triggerLabel,
  triggerIcone,
  title,
  fields,
  action,
  hidden,
  triggerProps,
  triggerVariant = "solid",
  triggerSize = "sm",
  triggerPalette = "brand",
  submitLabel,
  description,
  open: openProp,
  onOpenChange,
  showTrigger = true,
  degrauDesktop = "lg",
  tom = "neutro",
  lazy = true,
  aoConcluir,
  children,
}: {
  triggerLabel: ReactNode;
  triggerIcone?: ReactNode;
  title: string;
  fields: CampoSpec[];
  action: AcaoDeFormulario<E>;
  hidden?: Record<string, string>;
  triggerProps?: Record<string, unknown>;
  triggerVariant?: "solid" | "outline" | "ghost" | "subtle";
  triggerSize?:
    | "2xs"
    | "xs"
    | "sm"
    | "md"
    | { base: "2xs" | "xs" | "sm" | "md"; md: "2xs" | "xs" | "sm" | "md" };
  triggerPalette?: string;
  submitLabel?: string;
  description?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  degrauDesktop?: Degrau;
  tom?: Tom;
  lazy?: boolean;
  aoConcluir?: (state: Awaited<E>) => void;
  children?: ReactNode;
}) {
  const textos = useUiTextos();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (o: boolean) => {
    if (isControlled) onOpenChange?.(o);
    else setInternalOpen(o);
  };
  const formRef = useRef<HTMLFormElement>(null);
  const [formKey, setFormKey] = useState(0);

  const { formAction, pending } = useEnvioDeFormulario<E>(action, {
    // o diálogo já responde fechando; o toast de sucesso viria por cima dele
    toastDeSucesso: false,
    aoConcluir,
    aoTerSucesso: () => {
      setOpen(false);
      formRef.current?.reset();
      setFormKey((k) => k + 1);
    },
  });

  const soIcone = triggerIcone ? "md" : undefined;
  const gatilho = (
    <Button
      colorPalette={triggerPalette}
      variant={triggerVariant}
      size={triggerSize}
      title={soIcone ? (typeof triggerLabel === "string" ? triggerLabel : title) : undefined}
      aria-label={soIcone ? (typeof triggerLabel === "string" ? triggerLabel : title) : undefined}
      {...triggerProps}
    >
      {triggerIcone}
      {soIcone ? (
        <Box as="span" hideBelow="md">
          {triggerLabel}
        </Box>
      ) : (
        triggerLabel
      )}
    </Button>
  );

  return (
    <Modal
      abertura={
        showTrigger
          ? { modo: "gatilho", children: gatilho, aberto: open, aoMudar: setOpen }
          : { modo: "controlado", aberto: open, aoMudar: setOpen }
      }
      titulo={title}
      degrauDesktop={degrauDesktop}
      tom={tom}
      lazy={lazy}
      form={{ action: formAction, ref: formRef, key: formKey }}
      acaoPrimaria={{ rotulo: submitLabel ?? textos.salvar, submit: true, carregando: pending }}
      rotuloCancelar={textos.cancelar}
    >
      {hidden &&
        Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {description && <Stack>{description}</Stack>}
      <CamposDoFormulario campos={fields} />
      {children}
    </Modal>
  );
}
