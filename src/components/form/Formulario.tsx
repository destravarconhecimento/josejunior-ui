"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { Flex, SimpleGrid, Stack } from "../../primitives";
import { chakra } from "../../chakra-controls";
import { Button, TONE_DO_PAPEL, type PapelDeBotao } from "../Button";
import { Campo, type CampoSpec } from "./Campo";
import { useEnvioDeFormulario, type AcaoDeFormulario, type EstadoDoFormulario } from "./envio";

/**
 * O FORMULÁRIO PADRÃO DO PAINEL.
 *
 * A tela não escreve `<form>` nem `useActionState`: ela declara o que o
 * formulário É, e o motor do kit cuida do envio, do "carregando", do toast e do
 * `router.refresh()`. O que a tela escolhe é DADO, não desenho:
 *
 *  · `campos` — a MESMA lista que o `<FormDialog>` recebe;
 *  · `orientacao` — `grade` (2 colunas), `coluna` (uma embaixo da outra) ou
 *    `linha` (filtro/busca em barra);
 *  · `barraFixa` — quando o salvar tem de colar no pé de um formulário longo;
 *  · `resultado(state)` — quando a action devolve DADO e não só "deu certo";
 *  · `limparNoSucesso` — cadastro em sequência (a `key` remonta o form, que é o
 *    único jeito de zerar campo não controlado de verdade).
 *
 * O botão pode morar no CORPO: sem `rotuloEnviar` não há rodapé, e o
 * `<BotaoDeEnvio>` pega o "carregando" por contexto onde estiver.
 *
 * Envio que NÃO vai ao servidor (filtro local, passo de assistente) usa
 * `aoEnviar` — aí o formulário não tem action e o "carregando" é de quem chama.
 */
const CtxFormulario = createContext<{ pending: boolean }>({ pending: false });

export function useEstadoDoFormulario() {
  return useContext(CtxFormulario);
}

export type { PapelDeBotao } from "../Button";

export function BotaoDeEnvio({
  rotulo,
  papel = "principal",
  desabilitado,
  ...rest
}: {
  rotulo: string;
  papel?: PapelDeBotao;
  desabilitado?: boolean;
} & Record<string, unknown>) {
  const { pending } = useEstadoDoFormulario();
  return (
    <Button
      tone={TONE_DO_PAPEL[papel] ?? "outline"}
      size="sm"
      type="submit"
      loading={pending}
      disabled={desabilitado}
      {...rest}
    >
      {rotulo}
    </Button>
  );
}

export function CamposDoFormulario({
  campos,
  colunas = 2,
}: {
  campos: CampoSpec[];
  colunas?: number;
}) {
  if (campos.length === 0) return null;
  return (
    <SimpleGrid columns={{ base: 1, sm: colunas }} gap="4">
      {campos.map((f) => (
        <Campo key={f.testId ?? f.name} campo={f} />
      ))}
    </SimpleGrid>
  );
}

const SEM_ACAO = async <E,>(prev: E) => prev;

export function Formulario<E extends EstadoDoFormulario = EstadoDoFormulario>({
  id,
  action,
  aoEnviar,
  enviando = false,
  campos,
  orientacao = "grade",
  colunas = 2,
  hidden,
  rotuloEnviar,
  iconeEnviar,
  tamanhoEnviar = "sm",
  papel = "principal",
  desabilitado = false,
  aoConcluir,
  limparNoSucesso = false,
  refreshOnSuccess = true,
  mensagemDeSucesso,
  duracaoDoToast,
  toastDeSucesso = true,
  acoesRodape,
  barraFixa = false,
  resultado,
  testId,
  botaoTestId,
  autoComplete,
  gap = "3",
  children,
}: {
  /**
   * `id` do elemento `<form>`. Serve ao botão que mora FORA dele — o rodapé de
   * um diálogo é irmão do corpo na árvore, então lá o `type="submit"` só envia
   * com `form="<id>"`.
   */
  id?: string;
  action?: AcaoDeFormulario<E>;
  /**
   * Envio que NÃO vai a uma server action (estado controlado, assistente, filtro
   * local). Recebe o `FormData` do próprio form — assim a tela que mistura
   * campo controlado com campo nativo continua lendo os nativos sem guardar um
   * estado para cada um.
   */
  aoEnviar?: (dados: FormData) => void;
  enviando?: boolean;
  campos?: CampoSpec[];
  orientacao?: "grade" | "coluna" | "linha";
  colunas?: number;
  hidden?: Record<string, string>;
  rotuloEnviar?: string;
  iconeEnviar?: ReactNode;
  tamanhoEnviar?: "2xs" | "xs" | "sm" | "md";
  papel?: PapelDeBotao;
  desabilitado?: boolean;
  aoConcluir?: (state: Awaited<E>) => void;
  limparNoSucesso?: boolean;
  refreshOnSuccess?: boolean;
  mensagemDeSucesso?: string;
  duracaoDoToast?: number;
  toastDeSucesso?: boolean;
  acoesRodape?: ReactNode;
  barraFixa?: boolean;
  resultado?: (state: Awaited<E>) => ReactNode;
  testId?: string;
  botaoTestId?: string;
  autoComplete?: "off" | "on";
  gap?: string;
  children?: ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [chaveDoForm, setChaveDoForm] = useState(0);
  const { state, formAction, pending } = useEnvioDeFormulario<E>(
    action ?? (SEM_ACAO as AcaoDeFormulario<E>),
    {
      aoConcluir,
      aoTerSucesso: limparNoSucesso
        ? () => {
            formRef.current?.reset();
            setChaveDoForm((k) => k + 1);
          }
        : undefined,
      refreshOnSuccess,
      mensagemDeSucesso,
      duracaoDoToast,
      toastDeSucesso,
    },
  );

  const envio = action
    ? { action: formAction }
    : {
        onSubmit: (e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          aoEnviar?.(new FormData(e.currentTarget));
        },
      };
  const carregando = action ? pending : enviando;

  const ocultos = hidden
    ? Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)
    : null;

  const botao = rotuloEnviar ? (
    <Button
      tone={TONE_DO_PAPEL[papel] ?? "outline"}
      type="submit"
      size={tamanhoEnviar}
      loading={carregando}
      disabled={desabilitado}
      data-testid={botaoTestId}
    >
      {iconeEnviar}
      {rotuloEnviar}
    </Button>
  ) : null;

  const barra = barraFixa
    ? ({
        position: "sticky",
        bottom: "0",
        bg: "bg",
        py: "3",
        borderTopWidth: "1px",
        borderColor: "border.subtle",
        zIndex: "1",
      } as const)
    : null;

  if (orientacao === "linha") {
    const linha = (
      <chakra.form
        key={chaveDoForm}
        id={id}
        ref={formRef}
        {...envio}
        autoComplete={autoComplete}
        aria-busy={carregando}
        data-testid={testId}
      >
        {ocultos}
        <Flex gap="2" align="end" wrap="wrap">
          {campos?.map((f) => (
            <Campo key={f.testId ?? f.name} campo={f} />
          ))}
          {children}
          {acoesRodape}
          {botao}
        </Flex>
      </chakra.form>
    );
    return (
      <CtxFormulario.Provider value={{ pending: carregando }}>
        {resultado ? (
          <Stack gap={gap}>
            {linha}
            {resultado(state)}
          </Stack>
        ) : (
          linha
        )}
      </CtxFormulario.Provider>
    );
  }

  return (
    <CtxFormulario.Provider value={{ pending: carregando }}>
      <chakra.form
        key={chaveDoForm}
        id={id}
        ref={formRef}
        {...envio}
        autoComplete={autoComplete}
        aria-busy={carregando}
        data-testid={testId}
      >
        {ocultos}
        <Stack gap={gap}>
          {orientacao === "coluna" ? (
            <Stack gap="4">
              {campos?.map((f) => (
                <Campo key={f.testId ?? f.name} campo={f} />
              ))}
            </Stack>
          ) : (
            <CamposDoFormulario campos={campos ?? []} colunas={colunas} />
          )}
          {children}
          {(acoesRodape || botao) && (
            <Flex justify="flex-end" gap="2" align="center" wrap="wrap" {...barra}>
              {acoesRodape}
              {botao}
            </Flex>
          )}
          {resultado?.(state)}
        </Stack>
      </chakra.form>
    </CtxFormulario.Provider>
  );
}
