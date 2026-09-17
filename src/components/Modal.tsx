"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type Key,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { Box, HStack, Stack, Text, VisuallyHidden } from "../primitives";
import { CloseButton, Dialog, Portal } from "../chakra-controls";
import { Button } from "./Button";
import { useUiTextos } from "../provider/textos";
import {
  LARGURA_DO_DEGRAU,
  alturaDaFolha,
  degrauDoNivel,
  montarRodape,
  nivelExcedido,
  type AcaoDescritor,
  type BotaoRodape,
  type Degrau,
  type Tom,
  type Variante,
} from "./modal/calc";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * UM DIÁLOGO SÓ, NOS DOIS SISTEMAS (17/09)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Este componente veio do 8899br, onde já tinha nascido de uso real, e
 * SUBSTITUI o Modal de 76 linhas que vivia aqui. A escolha foi deliberada:
 * numa disputa entre dois componentes que fazem a mesma coisa, sobe o que sabe
 * mais — trocar pelo mais pobre para "unificar" seria unificar para baixo.
 *
 * O que ele sabe e o anterior não sabia:
 *
 * · **folha no celular.** Abaixo de 768px o diálogo cola no rodapé da tela e
 *   entra deslizando de baixo, com a altura descontando o nível de aninhamento.
 *   Diálogo centralizado em tela pequena briga com o teclado virtual.
 * · **variantes**: `dialogo` (o padrão), `painel` (gaveta lateral de 320px,
 *   altura cheia) e `midia` (a foto/vídeo ocupando a tela, sem respiro).
 * · **aninhamento com TRAVA**: cada nível encolhe um degrau, e o terceiro
 *   diálogo empilhado LANÇA em desenvolvimento. Três diálogos em cima do outro
 *   não é aninhamento — é uma tela que devia ser página.
 * · **rodapé montado por regra** (`montarRodape`), não à mão: ordem dos botões,
 *   qual fecha ao clicar, qual é `submit`, e a paleta pelo tom. No celular eles
 *   viram coluna invertida e ocupam a largura toda, respeitando a área segura.
 * · **`form` embrulhando o diálogo INTEIRO** com `display: contents` — é o que
 *   permite o botão do rodapé enviar o formulário do corpo sem `form="id"` e
 *   sem mudar o layout.
 * · **passos**, **ferramentas** no cabeçalho e **baixar**.
 *
 * ── A GRAFIA CURTA ───────────────────────────────────────────────────────────
 * Os 201 usos deste pacote (e os 15 componentes internos) chamam o diálogo com
 * `open`/`onClose`/`title`/`footer`/`size`, que era a API do modal antigo. Ela
 * continua valendo e é traduzida aqui dentro para a forma rica: é UMA
 * implementação com duas grafias, não dois componentes. Em código novo prefira
 * a forma rica (`abertura`/`titulo`), que é a que dá acesso ao resto.
 *
 * A largura sai de `LARGURA_DO_DEGRAU` e é aplicada no próprio conteúdo, em vez
 * de depender de uma receita `slotRecipes.dialog` no tema de cada app — assim o
 * `size="lg"` significa a mesma coisa nos dois sistemas.
 */
const TELEFONE = "@media (max-width: 47.9975em)";

export type { Degrau, Tom, Variante } from "./modal/calc";
export { degrauPorConteudo, degrauDoNivel, type CampoParaDegrau } from "./modal/calc";

export const NivelModal = createContext(0);

export const AberturaExterna = createContext<{
  aberto: boolean;
  aoMudar: (aberto: boolean) => void;
} | null>(null);

export type Abertura =
  | {
      modo: "gatilho";
      children: ReactElement;
      aberto?: boolean;
      aoMudar?: (aberto: boolean) => void;
    }
  | { modo: "controlado"; aberto: boolean; aoMudar: (aberto: boolean) => void };

export type Acao = AcaoDescritor<ReactNode>;

export type ModalProps = {
  abertura: Abertura;

  titulo: string;
  tituloOculto?: boolean;
  subtitulo?: ReactNode;

  variante?: Variante;
  lado?: "inicio" | "fim";
  proporcao?: number;
  baixar?: { href: string; nome: string };

  degrauDesktop?: Degrau;

  tom?: Tom;

  ferramentas?: ReactNode;

  acaoPrimaria?: Acao & { submit?: boolean };
  acoesExtras?: [Acao?, Acao?];
  rotuloCancelar?: string | null;
  notaRodape?: ReactNode;

  /** Rodapé cru, para quem monta os próprios botões (a grafia curta usa isto). */
  rodape?: ReactNode;

  form?: { action: (fd: FormData) => void; ref?: Ref<HTMLFormElement>; key?: Key };

  passos?: { atual: number; total: number; rotulos?: string[] };

  reservar?: string;

  lazy?: boolean;

  superficie?: { bg?: string; color?: string };

  aoFechar?: () => void;
  children: ReactNode;
};

/** A grafia curta — a API do modal anterior deste pacote. */
export type ModalPropsCurto = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  footer?: ReactNode;
  size?: Degrau | "full";
  children: ReactNode;
};

function paletaDoBotao(b: BotaoRodape<ReactNode>): string {
  if (b.tom === "perigo") return "critical";
  return b.papel === "primaria" ? "brand" : "gray";
}

function ehCurto(p: ModalProps | ModalPropsCurto): p is ModalPropsCurto {
  return (p as ModalPropsCurto).open !== undefined || (p as ModalProps).abertura === undefined;
}

export function Modal(props: ModalProps | ModalPropsCurto) {
  const ricas: ModalProps = ehCurto(props)
    ? {
        abertura: { modo: "controlado", aberto: props.open, aoMudar: (a) => { if (!a) props.onClose(); } },
        // `title` era opcional e às vezes vinha como JSX; o cabeçalho rico pede
        // texto. Sem título, o diálogo fica sem faixa — como era antes.
        titulo: typeof props.title === "string" ? props.title : "",
        tituloOculto: typeof props.title !== "string" && props.title != null ? true : undefined,
        subtitulo: typeof props.title !== "string" ? props.title : undefined,
        degrauDesktop: props.size === "full" ? "cover" : (props.size ?? "md"),
        rodape: props.footer,
        rotuloCancelar: null,
        children: props.children,
      }
    : props;

  return <ModalRico {...ricas} />;
}

function ModalRico({
  abertura,
  titulo,
  tituloOculto = false,
  subtitulo,
  variante = "dialogo",
  lado = "fim",
  proporcao,
  baixar,
  degrauDesktop = "md",
  tom = "neutro",
  ferramentas,
  acaoPrimaria,
  acoesExtras,
  rotuloCancelar,
  notaRodape,
  rodape: rodapeCru,
  form,
  passos,
  reservar,
  lazy = true,
  superficie,
  aoFechar,
  children,
}: ModalProps) {
  const textos = useUiTextos();
  const nivel = useContext(NivelModal);
  const ctxAbertura = useContext(AberturaExterna);
  const externo = abertura.modo === "gatilho" ? ctxAbertura : null;
  const abertoExterno = externo?.aberto;
  const abertoInterno = abertura.aberto;
  const anteriorInterno = useRef(abertoInterno);

  useEffect(() => {
    if (abertoExterno) abertura.aoMudar?.(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abertoExterno]);

  useEffect(() => {
    if (externo && anteriorInterno.current && abertoInterno === false) externo.aoMudar(false);
    anteriorInterno.current = abertoInterno;
  }, [abertoInterno, externo]);

  if (process.env.NODE_ENV !== "production" && nivelExcedido(nivel)) {
    throw new Error(
      `Modal aninhado no nível ${nivel} ("${titulo}"). Três diálogos empilhados não é aninhamento: é uma tela que devia ser página.`,
    );
  }

  const degrau = degrauDoNivel(degrauDesktop, nivel);
  const ehFolhaDeBaixo = variante === "dialogo";

  const rodape = montarRodape<ReactNode>({
    variante,
    acaoPrimaria,
    acoesExtras,
    rotuloCancelar: rotuloCancelar === null ? null : rotuloCancelar,
    rotuloFecharPadrao: textos.fechar,
    tomDoModal: tom,
  });

  const aoMudarAbertura = (aberto: boolean) => {
    abertura.aoMudar?.(aberto);
    externo?.aoMudar(aberto);
    if (!aberto) aoFechar?.();
  };

  const alturaDesktop = degrau === "cover" ? "calc(100dvh - 4rem)" : "calc(100dvh - 8rem)";
  const larguraDesktop = degrau === "cover" ? undefined : LARGURA_DO_DEGRAU[degrau];

  const temCabecalho = Boolean(titulo) || Boolean(subtitulo) || Boolean(ferramentas) || Boolean(baixar) || Boolean(passos);

  const cabecalho = temCabecalho ? (
    <Dialog.Header
      borderBottomWidth="1px"
      borderColor="var(--admin-border, rgba(0,0,0,.1))"
      display="grid"
      gridTemplateColumns="1fr auto"
      alignItems={tituloOculto ? "center" : "start"}
      gap="3"
      py={tituloOculto && (ferramentas || baixar) ? "2" : undefined}
      pb={!tituloOculto && (ferramentas || passos) ? "3" : undefined}
    >
      <Stack gap="0.5" minW="0" gridRow="1" gridColumn="1">
        {tituloOculto ? (
          <VisuallyHidden>
            <Dialog.Title>{titulo}</Dialog.Title>
          </VisuallyHidden>
        ) : (
          <Dialog.Title lineClamp={2}>{titulo}</Dialog.Title>
        )}
        {subtitulo && (
          <Dialog.Description fontSize="sm" lineClamp={1}>
            {subtitulo}
          </Dialog.Description>
        )}
      </Stack>

      <Dialog.ActionTrigger asChild>
        <CloseButton size="sm" aria-label={textos.fechar} />
      </Dialog.ActionTrigger>

      {passos && (
        <HStack gridColumn="1 / -1" gap="2" align="center">
          <HStack gap="1" flex="1" minW="0">
            {Array.from({ length: passos.total }, (_, i) => (
              <Box
                key={i}
                h="3px"
                flex="1"
                borderRadius="full"
                bg={i < passos.atual ? "var(--admin-primary)" : "border"}
              />
            ))}
          </HStack>
          <Text fontSize="xs" color="fg.muted" flexShrink="0">
            {passos.rotulos?.[passos.atual - 1] ?? `${passos.atual}/${passos.total}`}
          </Text>
        </HStack>
      )}

      {(ferramentas || baixar) && (
        <HStack
          gridColumn={tituloOculto ? "1" : "1 / -1"}
          gridRow={tituloOculto ? "1" : undefined}
          minW="0"
          gap="2"
          overflowX="auto"
          css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
        >
          {ferramentas}
          {baixar && (
            <Button asChild size="xs" variant="outline" colorPalette="gray" flexShrink="0">
              <a href={baixar.href} download={baixar.nome}>
                {baixar.nome}
              </a>
            </Button>
          )}
        </HStack>
      )}
    </Dialog.Header>
  ) : null;

  const corpo = (
    <Dialog.Body
      display="flex"
      flexDirection="column"
      gap="4"
      minH={reservar}
      p={variante === "midia" ? "0" : undefined}
    >
      {variante === "midia" && proporcao ? (
        <Box w="full" aspectRatio={proporcao} display="flex" alignItems="center" justifyContent="center">
          {children}
        </Box>
      ) : (
        children
      )}
    </Dialog.Body>
  );

  const pe = rodapeCru ? (
    <Dialog.Footer
      css={{
        [TELEFONE]: {
          flexDirection: "column-reverse",
          alignItems: "stretch",
          paddingBottom: "calc(var(--chakra-spacing-4) + env(safe-area-inset-bottom, 0px))",
        },
      }}
      gap="2"
    >
      {rodapeCru}
    </Dialog.Footer>
  ) : (
    rodape.mostrar && (
      <Dialog.Footer
        css={{
          [TELEFONE]: {
            flexDirection: "column-reverse",
            alignItems: "stretch",
            paddingBottom: "calc(var(--chakra-spacing-4) + env(safe-area-inset-bottom, 0px))",
          },
        }}
        gap="2"
      >
        {notaRodape && (
          <Box flex="1" minW="0" fontSize="sm" color="fg.muted">
            {notaRodape}
          </Box>
        )}
        {rodape.botoes.map((b, i) => {
          const chave = `${b.papel}-${i}`;
          const botao = (
            <Button
              key={chave}
              type={b.submit ? "submit" : "button"}
              variant={b.papel === "primaria" ? "solid" : "outline"}
              colorPalette={paletaDoBotao(b)}
              loading={b.carregando}
              disabled={b.disabled}
              onClick={b.onClick}
              size={{ base: "lg", md: "sm" }}
              w={{ base: "full", md: "auto" }}
            >
              {b.rotulo}
            </Button>
          );
          return b.fecharAoClicar ? (
            <Dialog.ActionTrigger asChild key={chave}>
              {botao}
            </Dialog.ActionTrigger>
          ) : (
            botao
          );
        })}
      </Dialog.Footer>
    )
  );

  const miolo = (
    <>
      {cabecalho}
      {corpo}
      {pe}
    </>
  );

  return (
    <Dialog.Root
      {...(externo ? { open: externo.aberto } : abertura.aberto !== undefined ? { open: abertura.aberto } : {})}
      onOpenChange={(e) => aoMudarAbertura(e.open)}
      size={degrau === "cover" ? "cover" : undefined}
      placement="center"
      scrollBehavior="inside"
      role={tom === "perigo" ? "alertdialog" : "dialog"}
      motionPreset={
        variante === "painel"
          ? lado === "inicio"
            ? "slide-in-left"
            : "slide-in-right"
          : ehFolhaDeBaixo
            ? { base: "slide-in-bottom", md: "scale" }
            : "scale"
      }
      lazyMount={lazy}
      unmountOnExit={lazy}
    >
      {abertura.modo === "gatilho" && !externo && <Dialog.Trigger asChild>{abertura.children}</Dialog.Trigger>}
      <Portal>
        <Dialog.Backdrop
          bg="rgba(15,23,42,0.5)"
          backdropFilter="blur(4px)"
          css={{ "--layer-index": nivel }}
        />
        <Dialog.Positioner
          css={{
            "--layer-index": nivel,
            ...(variante === "painel"
              ? { justifyContent: lado === "inicio" ? "flex-start" : "flex-end", alignItems: "stretch" }
              : {}),
            ...(ehFolhaDeBaixo ? { [TELEFONE]: { alignItems: "flex-end" } } : {}),
          }}
        >
          <Dialog.Content
            bg={superficie?.bg ?? "var(--admin-surface, #fff)"}
            color={superficie?.color}
            // O acabamento e do design-system, nao do tema de cada app: antes o
            // canto e a sombra sairiam da receita do Chakra de quem consome, e
            // os dois paineis ficariam com diferenca visivel no mesmo dialogo.
            borderRadius="16px"
            boxShadow="0 24px 60px rgba(15,23,42,0.22)"
            overflow="hidden"
            css={{
              ...(variante === "painel"
                ? {
                    width: "320px",
                    maxWidth: "100dvw",
                    height: "100dvh",
                    maxHeight: "100dvh",
                    borderRadius: 0,
                    "--dialog-margin": "0",
                  }
                : variante === "midia"
                  ? {
                      maxWidth: "min(96vw, 1100px)",
                      maxHeight: "92dvh",
                      [TELEFONE]: { maxWidth: "100dvw", maxHeight: "100dvh", borderRadius: 0, "--dialog-margin": "0" },
                    }
                  : {
                      // a largura do degrau vem da tabela, não de uma receita
                      // que cada app teria de repetir no próprio tema
                      ...(larguraDesktop ? { width: "100%", maxWidth: larguraDesktop } : {}),
                      maxHeight: alturaDesktop,
                      [TELEFONE]: {
                        width: "100dvw",
                        maxWidth: "100dvw",
                        maxHeight: alturaDaFolha(nivel),
                        borderStartStartRadius: "var(--chakra-radii-l3)",
                        borderStartEndRadius: "var(--chakra-radii-l3)",
                        borderEndStartRadius: 0,
                        borderEndEndRadius: 0,
                        "--dialog-margin": "0",
                      },
                    }),
            }}
          >
            <NivelModal.Provider value={nivel + 1}>
              <AberturaExterna.Provider value={null}>
                {form ? (
                  /* eslint-disable-next-line react-hooks/refs -- o `form.ref` é
                     um ref DO CHAMADOR sendo REPASSADO, não um ref LIDO durante
                     o render: nada aqui toca em `.current`. A regra é heurística
                     pelo nome da propriedade e acusa as três linhas de uma vez. */
                  <form key={form.key} action={form.action} ref={form.ref} style={{ display: "contents" }}>
                    {miolo}
                  </form>
                ) : (
                  miolo
                )}
              </AberturaExterna.Provider>
            </NivelModal.Provider>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

/** Bloco com subtítulo dentro do corpo do diálogo. */
export function ModalSecao({ titulo, children }: { titulo?: string; children: ReactNode }) {
  return (
    <Stack gap="2">
      {titulo && (
        <Text fontSize="sm" fontWeight="medium" color="fg.muted">
          {titulo}
        </Text>
      )}
      {children}
    </Stack>
  );
}

/**
 * Região que rola DENTRO do corpo, quando o diálogo tem parte fixa em cima da
 * lista (um filtro, um resumo). Sem ela o corpo inteiro rola e a parte fixa some.
 */
export function ModalScrollRegion({ children, minH }: { children: ReactNode; minH?: string }) {
  return (
    <Box flex="1" minH={minH ?? "0"} overflowY="auto" overscrollBehavior="contain">
      {children}
    </Box>
  );
}
