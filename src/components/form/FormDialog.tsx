"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { Stack } from "../../primitives";
import { chakra } from "../../chakra-controls";
import { Modal } from "../Modal";
import { Button } from "../Button";
import { CamposDoFormulario } from "./Formulario";
import { useEnvioDeFormulario, type AcaoDeFormulario, type EstadoDoFormulario } from "./envio";
import type { CampoSpec } from "./Campo";
import { useUiTextos } from "../../provider/textos";

/**
 * Formulário em DIÁLOGO — o "novo cliente", o "editar", o "convidar". Mesma
 * lista de `campos` do `<Formulario>`, mesmo motor de envio, mesmo toast.
 *
 * Duas coisas que ele resolve e que a tela sempre errava sozinha:
 *
 * · **o diálogo fecha no SUCESSO, e só nele.** Fechar no clique perde o erro
 *   (a pessoa não vê o que deu errado e o que digitou já foi embora); não
 *   fechar nunca deixa o diálogo aberto sobre a lista já atualizada.
 * · **o botão do rodapé envia o formulário do corpo.** No diálogo o rodapé fica
 *   FORA do `<form>` (é irmão dele na árvore do Dialog), então um `type=submit`
 *   ali não envia nada — o que liga os dois é o atributo `form="<id>"`. Sem
 *   isso o "Salvar" do canto vira um botão morto, que foi exatamente o defeito
 *   que apareceu em telas que montaram o diálogo à mão.
 *
 * Reabrir depois de salvar tem de mostrar o formulário LIMPO: além do `reset()`
 * trocamos a `key`, porque `reset` não zera campo controlado por estado.
 */
export function FormDialog<E extends EstadoDoFormulario = EstadoDoFormulario>({
  gatilho,
  titulo,
  campos,
  action,
  hidden,
  rotuloEnviar,
  descricao,
  aberto: abertoProp,
  aoMudarAberto,
  aoConcluir,
  tamanho = "lg",
  children,
}: {
  /** O que abre o diálogo. Sem gatilho, o diálogo é controlado de fora. */
  gatilho?: ReactNode;
  titulo: string;
  campos: CampoSpec[];
  action: AcaoDeFormulario<E>;
  hidden?: Record<string, string>;
  rotuloEnviar?: string;
  descricao?: ReactNode;
  aberto?: boolean;
  aoMudarAberto?: (aberto: boolean) => void;
  aoConcluir?: (state: Awaited<E>) => void;
  tamanho?: "sm" | "md" | "lg" | "xl";
  children?: ReactNode;
}) {
  const textos = useUiTextos();
  const idDoForm = useId();
  const [internoAberto, setInternoAberto] = useState(false);
  const controlado = abertoProp !== undefined;
  const aberto = controlado ? abertoProp : internoAberto;
  const setAberto = (o: boolean) => {
    if (controlado) aoMudarAberto?.(o);
    else setInternoAberto(o);
  };
  const formRef = useRef<HTMLFormElement>(null);
  const [chaveDoForm, setChaveDoForm] = useState(0);

  const { formAction, pending } = useEnvioDeFormulario<E>(action, {
    // o diálogo já responde fechando; o toast de sucesso viria por cima dele
    toastDeSucesso: false,
    aoConcluir,
    aoTerSucesso: () => {
      setAberto(false);
      formRef.current?.reset();
      setChaveDoForm((k) => k + 1);
    },
  });

  return (
    <>
      {gatilho ? (
        <chakra.span onClick={() => setAberto(true)} display="contents">
          {gatilho}
        </chakra.span>
      ) : null}
      <Modal
        open={aberto}
        onClose={() => setAberto(false)}
        title={titulo}
        size={tamanho}
        footer={
          <>
            <Button tone="ghost" type="button" onClick={() => setAberto(false)}>
              {textos.cancelar}
            </Button>
            <Button tone="primary" type="submit" form={idDoForm} loading={pending}>
              {rotuloEnviar ?? textos.salvar}
            </Button>
          </>
        }
      >
        <chakra.form key={chaveDoForm} id={idDoForm} ref={formRef} action={formAction}>
          <Stack gap="4">
            {hidden &&
              Object.entries(hidden).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
            {descricao}
            <CamposDoFormulario campos={campos} />
            {children}
          </Stack>
        </chakra.form>
      </Modal>
    </>
  );
}
