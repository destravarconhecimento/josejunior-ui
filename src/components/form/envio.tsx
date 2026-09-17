"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toaster } from "../Toast";
import { useUiTextos, useUiTraducao } from "../../provider/textos";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * UM FORMULÁRIO, UM MOTOR
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Todo envio do painel passa por aqui: `<Formulario>` (na tela),
 * `<FormDialog>` (em diálogo) e o botão de uma ação só usam este hook por
 * dentro. Quem precisa disparar de forma imperativa (um item de menu, um clique
 * num canvas) chama o HOOK — nunca o `useActionState` cru.
 *
 * O que ele carrega, e que cada cópia à mão perdia uma parte:
 *
 * · **guard por IDENTIDADE do estado.** Comparar campo a campo (ou confiar no
 *   `ok`) faz o segundo "salvar" seguido não reagir: o estado novo é igual ao
 *   anterior e o efeito não dispara. Guardamos a REFERÊNCIA do último estado
 *   visto — o React sempre devolve um objeto novo por envio.
 * · **a resposta é TOAST.** Linha verde/vermelha embaixo do formulário é a
 *   mesma frase duas vezes na tela, e ela fica lá até o envio seguinte, longe
 *   do botão que a provocou. (Tela de ACESSO é a exceção: lá o formulário é a
 *   página inteira — passe `toastDeErro: false`.)
 * · **`messageKey` vence `message`.** A action que sabe traduzir manda a chave e
 *   quem traduz é a TELA, no idioma de quem está olhando. A que ainda não sabe
 *   manda o texto e nada muda para ela. Chave que não existe cai no texto cru:
 *   ler no idioma errado é ruim, ficar sem resposta nenhuma é pior.
 * · **`router.refresh()` no sucesso**, porque o dado que a tela mostra acabou
 *   de mudar no servidor.
 */
export type EstadoDoFormulario = {
  error?: string;
  ok?: boolean;
  message?: string;
  /** Caminho de tradução (`aprovacoes.enviada`) — vence `message`. */
  messageKey?: string;
  /** Deu certo, MAS com ressalva: vira toast de aviso, não de sucesso. */
  aviso?: string;
  dados?: Record<string, unknown>;
};

export type AcaoDeFormulario<E extends EstadoDoFormulario = EstadoDoFormulario> = (
  prev: Awaited<E>,
  formData: FormData,
) => Promise<E>;

export function useEnvioDeFormulario<E extends EstadoDoFormulario = EstadoDoFormulario>(
  action: AcaoDeFormulario<E>,
  {
    aoConcluir,
    aoTerSucesso,
    refreshOnSuccess = true,
    toastDeSucesso = true,
    toastDeErro = true,
    mensagemDeSucesso,
    duracaoDoToast,
  }: {
    aoConcluir?: (state: Awaited<E>) => void;
    aoTerSucesso?: () => void;
    refreshOnSuccess?: boolean;
    mensagemDeSucesso?: string;
    duracaoDoToast?: number;
    toastDeSucesso?: boolean;
    toastDeErro?: boolean;
  } = {},
) {
  const textos = useUiTextos();
  const traduzirChave = useUiTraducao();
  const router = useRouter();
  const [state, formAction, pending] = useActionState<E, FormData>(action, {} as Awaited<E>);
  const visto = useRef<Awaited<E>>(state);

  useEffect(() => {
    if (state === visto.current) return;
    visto.current = state;
    const texto = (state.messageKey ? traduzirChave(state.messageKey) : null) ?? state.message ?? null;
    if (state.ok) {
      if (state.aviso) {
        toaster.create({
          type: "warning",
          title: texto ?? mensagemDeSucesso ?? textos.salvo,
          description: state.aviso,
          duration: duracaoDoToast,
        });
      } else if (toastDeSucesso || texto) {
        toaster.create({
          type: "success",
          title: texto ?? mensagemDeSucesso ?? textos.salvo,
          duration: duracaoDoToast,
        });
      }
      aoTerSucesso?.();
      aoConcluir?.(state);
      if (refreshOnSuccess) router.refresh();
    } else if (state.error && toastDeErro) {
      toaster.create({ type: "error", title: state.error, duration: duracaoDoToast });
    }
  }, [
    state,
    router,
    aoConcluir,
    aoTerSucesso,
    refreshOnSuccess,
    toastDeSucesso,
    toastDeErro,
    mensagemDeSucesso,
    duracaoDoToast,
    textos,
    traduzirChave,
  ]);

  return { state, formAction, pending };
}

/**
 * A MESMA resposta, para a ação que NÃO é um `<form action>`.
 *
 * Nem todo envio nasce de um `FormData`: o painel tem tela com estado
 * controlado que chama `salvarAlgo({ ... })` e devolve `{ ok, error }`, e tem
 * botão de menu que dispara uma ação sem formulário nenhum. Antes, cada uma
 * dessas telas carregava a sua dúzia de linhas — `loading`, `error`, uma caixa
 * vermelha embaixo, um "Salvo ✓" que ficava para sempre na tela — e as cópias
 * divergiram: umas avisavam, outras falhavam caladas.
 *
 * Este hook é o mesmo motor pelo lado imperativo: `pending` para o botão,
 * toast para a resposta, `router.refresh()` no sucesso. Ele entende as duas
 * convenções — o resultado `{ ok: false, error }` E a exceção lançada —, porque
 * as duas existem no código de hoje e converter uma tela não pode depender de
 * antes converter a action dela.
 */
export function useEnvioDeAcao<A extends unknown[], R extends EstadoDoFormulario | void>(
  executarAcao: (...args: A) => Promise<R>,
  {
    aoConcluir,
    aoTerSucesso,
    refreshOnSuccess = true,
    toastDeSucesso = true,
    toastDeErro = true,
    mensagemDeSucesso,
    duracaoDoToast,
  }: {
    aoConcluir?: (resultado: R) => void;
    aoTerSucesso?: () => void;
    refreshOnSuccess?: boolean;
    mensagemDeSucesso?: string;
    duracaoDoToast?: number;
    toastDeSucesso?: boolean;
    toastDeErro?: boolean;
  } = {},
) {
  const textos = useUiTextos();
  const traduzirChave = useUiTraducao();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const enviar = useCallback(async (...args: A) => {
    setPending(true);
    let resultado: R;
    try {
      resultado = await executarAcao(...args);
    } catch (e) {
      // Exceção não tratada NUNCA pode sumir: sem isto o botão volta ao normal
      // e a tela finge que salvou.
      if (toastDeErro) {
        toaster.create({
          type: "error",
          title: e instanceof Error ? e.message : String(e),
          duration: duracaoDoToast,
        });
      }
      setPending(false);
      return;
    }
    setPending(false);
    const estado = (resultado ?? {}) as EstadoDoFormulario;
    const texto = (estado.messageKey ? traduzirChave(estado.messageKey) : null) ?? estado.message ?? null;
    // `ok` ausente = ação que não responde nada; nesse caso o sucesso é não ter
    // dado erro, que é como as actions antigas se comportam.
    const deuCerto = estado.ok !== false && !estado.error;
    if (!deuCerto) {
      if (toastDeErro) {
        toaster.create({ type: "error", title: estado.error ?? texto ?? "", duration: duracaoDoToast });
      }
      aoConcluir?.(resultado);
      return;
    }
    if (estado.aviso) {
      toaster.create({
        type: "warning",
        title: texto ?? mensagemDeSucesso ?? textos.salvo,
        description: estado.aviso,
        duration: duracaoDoToast,
      });
    } else if (toastDeSucesso || texto) {
      toaster.create({
        type: "success",
        title: texto ?? mensagemDeSucesso ?? textos.salvo,
        duration: duracaoDoToast,
      });
    }
    aoTerSucesso?.();
    aoConcluir?.(resultado);
    if (refreshOnSuccess) router.refresh();
  }, [
    executarAcao,
    router,
    aoConcluir,
    aoTerSucesso,
    refreshOnSuccess,
    toastDeSucesso,
    toastDeErro,
    mensagemDeSucesso,
    duracaoDoToast,
    textos,
    traduzirChave,
  ]);

  return { enviar, pending };
}
