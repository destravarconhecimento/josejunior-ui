/**
 * AS DECISÕES DO MODAL, SEM REACT E SEM NAVEGADOR.
 *
 * Tudo que DECIDE alguma coisa no diálogo — quais botões o rodapé tem e em que
 * ordem, qual degrau de largura o conteúdo pede, o que o aninhamento faz com o
 * tamanho — mora aqui, e `Modal.tsx` fica sendo só a montagem do markup. É
 * assim que essa regra consegue ter teste: o 8899br roda o Vitest em
 * `environment: "node"`, sem jsdom, e é de lá que vem a suíte deste arquivo.
 *
 * É de propósito que nada aqui importa `react`: o dia em que a regra do rodapé
 * for testável apenas abrindo um navegador é o dia em que ela para de ser
 * testada.
 */

/**
 * Degrau de largura da CASA. Governa SÓ o desktop (>=768px).
 *
 * Não é o `size` do Chakra: a escala dele está deslocada um nome (o `xs` rende
 * 384px, o `sm` rende 448…), então o degrau vale pelo px de `LARGURA_DO_DEGRAU`
 * logo abaixo. `full` NÃO EXISTE aqui — é ele que injeta `minH: 100dvh` e, como
 * em CSS `min-height` ganha de `max-height`, anula o `scrollBehavior="inside"`.
 * Quem digitar não compila.
 */
export type Degrau = "xs" | "sm" | "md" | "lg" | "xl" | "cover";

/**
 * As duas exceções de tela cheia são VARIANTES, não degraus: ninguém chega
 * nelas escolhendo tamanho.
 */
export type Variante = "dialogo" | "midia" | "painel";

export type Tom = "neutro" | "perigo";

/** Ordem de grandeza. `cover` é o topo — e é o único que a fórmula nunca
 *  devolve: tela cheia é escolha explícita, nunca resultado de conta. */
export const DEGRAUS: readonly Degrau[] = ["xs", "sm", "md", "lg", "xl", "cover"];

/**
 * A tabela de larguras, e a FONTE dela. O `Modal` aplica estes px direto no
 * conteúdo, em vez de depender do `size` do Chakra — cuja escala está deslocada
 * um nome (o `xs` dele rende 384px, o `sm` rende 448…) e cuja receita cada app
 * teria de repetir no próprio tema. Era assim no 8899br, e a receita de lá vive
 * conferida contra esta tabela pelo teste `modal-calc.test.ts`: tabela repetida
 * sem verificação é tabela que diverge.
 */
export const LARGURA_DO_DEGRAU: Record<Exclude<Degrau, "cover">, string> = {
  xs: "384px",
  sm: "448px",
  md: "512px",
  lg: "672px",
  xl: "896px",
};

/** Índice na escala. */
function ordem(d: Degrau): number {
  return DEGRAUS.indexOf(d);
}

/** O maior dos dois. É assim que o "piso mínimo md" do campo com busca se
 *  aplica sem apagar um degrau maior que a contagem já tinha pedido. */
export function degrauMaior(a: Degrau, b: Degrau): Degrau {
  return ordem(a) >= ordem(b) ? a : b;
}

/**
 * O que um diálogo FILHO recebe: um degrau abaixo do pai, com piso em `xs`.
 *
 * Tela-cheia-sobre-tela-cheia fica estruturalmente impossível: `cover` é o
 * topo da escala, então o filho de um `cover` é `xl` — um `cover` dentro de
 * outro seria literalmente a mesma caixa duas vezes, sem nenhuma pista visual
 * de que há dois diálogos abertos.
 */
export function degrauDoNivel(degrau: Degrau, nivel: number): Degrau {
  if (nivel <= 0) return degrau;
  const i = Math.max(0, ordem(degrau) - nivel);
  return DEGRAUS[i] ?? "xs";
}

/**
 * Altura da folha do TELEFONE por nível de aninhamento.
 *
 * 92dvh na raiz (a altura é a do conteúdo; isto é só o teto). A partir do
 * nível 1 o teto cai para 60dvh de propósito: o header do pai continua
 * aparecendo atrás, e essa é a única pista de que existe um diálogo embaixo.
 */
export function alturaDaFolha(nivel: number): string {
  return nivel >= 1 ? "60dvh" : "92dvh";
}

/** Nível a partir do qual o desenvolvimento lança. Três diálogos empilhados
 *  não é aninhamento: é uma tela que devia ser página. */
export const NIVEL_MAXIMO = 3;

export function nivelExcedido(nivel: number): boolean {
  return nivel >= NIVEL_MAXIMO;
}

/* ------------------------------------------------------------------ *
 * O RODAPÉ
 * ------------------------------------------------------------------ */

/**
 * `R` é o tipo do rótulo. Fica genérico só para este arquivo não precisar
 * importar `react` — em `modal.tsx` ele é instanciado com `React.ReactNode` e
 * no teste com `string`.
 */
export type AcaoDescritor<R> = {
  rotulo: R;
  onClick?: () => void;
  tom?: Tom;
  carregando?: boolean;
  disabled?: boolean;
  /** Vira `Dialog.ActionTrigger`: clicou, fecha. */
  fecharAoClicar?: boolean;
};

export type PapelDoRodape = "primaria" | "cancelar" | "extra";

export type BotaoRodape<R> = {
  papel: PapelDoRodape;
  rotulo: R;
  /** `true` só na primária de um Modal que carrega `form`. */
  submit: boolean;
  tom: Tom;
  onClick?: () => void;
  carregando: boolean;
  disabled: boolean;
  fecharAoClicar: boolean;
};

export type EntradaDoRodape<R> = {
  variante: Variante;
  acaoPrimaria?: AcaoDescritor<R> & { submit?: boolean };
  acoesExtras?: [AcaoDescritor<R>?, AcaoDescritor<R>?];
  /** `null` remove o Cancelar (só o assistente, que já tem "Voltar"). */
  rotuloCancelar?: R | null;
  /** Rótulo do "Fechar" que o componente injeta quando não há primária.
   *  Vem do i18n do chamador — este arquivo não traduz nada. */
  rotuloFecharPadrao: R;
  tomDoModal?: Tom;
};

export type Rodape<R> = {
  /** `false` só nas duas variantes declaradas sem rodapé. */
  mostrar: boolean;
  /**
   * ORDEM DO DOM, que é a ordem de tabulação: extras → Cancelar → PRIMÁRIA.
   * No desktop é essa mesma ordem da esquerda para a direita; no telefone o
   * `flexDirection: column-reverse` inverte só o DESENHO — a primária sobe para
   * onde está o polegar e o Tab continua indo Cancelar → Primária.
   */
  botoes: BotaoRodape<R>[];
};

/**
 * O RODAPÉ NUNCA FICA VAZIO E NUNCA É CONDICIONAL.
 *
 * Sem `acaoPrimaria` ele traz "Fechar" — e é isso que fecha de uma vez os 12
 * arquivos que hoje não têm `Dialog.Footer` nenhum e o rodapé fantasma de
 * `caixas-postais-view.tsx:517`, onde `{etiqueta && <Footer>}` desenha uma
 * barra vazia quando a condição cai do lado errado.
 *
 * DECISÃO tomada onde a síntese não falou: quando NÃO há primária, o "Fechar" é
 * o ÚNICO botão — não sai um "Cancelar" ao lado. Duas portas de saída com nomes
 * diferentes para a mesma coisa é pior que nenhuma.
 */
export function montarRodape<R>(e: EntradaDoRodape<R>): Rodape<R> {
  if (e.variante === "midia" || e.variante === "painel") {
    return { mostrar: false, botoes: [] };
  }

  const botoes: BotaoRodape<R>[] = [];

  for (const extra of e.acoesExtras ?? []) {
    if (!extra) continue;
    botoes.push({
      papel: "extra",
      rotulo: extra.rotulo,
      submit: false,
      tom: extra.tom ?? "neutro",
      onClick: extra.onClick,
      carregando: extra.carregando ?? false,
      disabled: extra.disabled ?? false,
      fecharAoClicar: extra.fecharAoClicar ?? false,
    });
  }

  if (e.acaoPrimaria) {
    if (e.rotuloCancelar !== null) {
      botoes.push({
        papel: "cancelar",
        rotulo: e.rotuloCancelar ?? e.rotuloFecharPadrao,
        submit: false,
        tom: "neutro",
        carregando: false,
        disabled: false,
        fecharAoClicar: true,
      });
    }
    botoes.push({
      papel: "primaria",
      rotulo: e.acaoPrimaria.rotulo,
      submit: e.acaoPrimaria.submit ?? false,
      /*
       * A cor da primária vem do TOM DO DIÁLOGO, nunca da paleta do gatilho. É
       * o que conserta o "Excluir remessa" (remessas-view.tsx:773), vermelho
       * hoje só porque o botão que o abre é vermelho — e aquele botão nem chega
       * a renderizar.
       */
      tom: e.acaoPrimaria.tom ?? e.tomDoModal ?? "neutro",
      onClick: e.acaoPrimaria.onClick,
      carregando: e.acaoPrimaria.carregando ?? false,
      disabled: e.acaoPrimaria.disabled ?? false,
      fecharAoClicar: e.acaoPrimaria.fecharAoClicar ?? false,
    });
  } else {
    botoes.push({
      papel: "primaria",
      rotulo: e.rotuloFecharPadrao,
      submit: false,
      tom: "neutro",
      carregando: false,
      disabled: false,
      fecharAoClicar: true,
    });
  }

  return { mostrar: true, botoes };
}

/** Quantas primárias o rodapé tem. Existe para o teste dizer "uma, e exatamente
 *  uma" sem varrer JSX: a garantia de TIPO (`acaoPrimaria` no singular) protege
 *  o call site, esta função protege a montagem. */
export function contarPrimarias<R>(r: Rodape<R>): number {
  return r.botoes.filter((b) => b.papel === "primaria").length;
}

/* ------------------------------------------------------------------ *
 * A DERIVAÇÃO DO TAMANHO
 * ------------------------------------------------------------------ */

/**
 * O pedaço de `FieldConfig` (form-dialog.tsx) que interessa para o tamanho.
 * Estrutural de propósito: `FieldConfig` é assinável a isto sem import, e assim
 * este arquivo continua sem depender de um módulo `"use client"`.
 */
export type CampoParaDegrau = {
  type?: string;
  colSpan?: 1 | 2;
  searchable?: boolean;
  options?: { value: string; label: string }[];
};

/**
 * O DEGRAU QUE O CONTEÚDO PEDE — a conta que hoje ninguém faz.
 *
 * Hoje TODO chamador de `FormDialog` leva `lg` (672px), de 1 campo a 20: um
 * formulário de dois campos abre com o dobro da caixa de que precisa, e é daí
 * que vem a sensação de "modal grande demais".
 *
 *   peso = por campo: textarea ou colSpan 2 → 2 ; os demais → 1
 *          + 1 se houver `description`
 *   piso: campo com busca (ou select com >8 opções) → mínimo `md`
 *         (é o "vincular pessoa à caixa postal": UM campo só, mas cada opção é
 *          "nome — CPF — cidade/UF", e em 448px o rótulo trunca)
 *   assistente (`passos`) → `xl`
 *   peso <=2 → xs · <=4 → sm · <=6 → md · <=14 → lg · >14 → xl
 *
 * Conferida contra o inventário dos 86 diálogos: acerta excluir agência (xs),
 * classificar anúncio (xs), editar spec (sm), fiscal (sm), loop (md), novo
 * produto (lg), editar endereço (lg), editar anúncio ML (lg) e nova remessa
 * (xl). Erra UM degrau em ~5 casos — e esses cinco levam `degrauDesktop`
 * explícito no call site. Não vale calibrar até 100%: fórmula com exceção
 * nomeada é auditável, fórmula com sete cláusulas não é.
 *
 * `temPassos` é o terceiro parâmetro: a síntese descreve a regra do assistente
 * mas não a tinha posto na assinatura. Entra opcional, para nenhum call site
 * futuro precisar mudar de forma.
 */
export function degrauPorConteudo(
  campos: CampoParaDegrau[],
  temDescricao?: boolean,
  temPassos?: boolean,
): Degrau {
  if (temPassos) return "xl";

  let peso = temDescricao ? 1 : 0;
  let piso: Degrau = "xs";

  for (const c of campos) {
    peso += c.type === "textarea" || c.colSpan === 2 ? 2 : 1;
    const listaLonga = c.type === "select" && (c.options?.length ?? 0) > 8;
    if (c.searchable || listaLonga) piso = degrauMaior(piso, "md");
  }

  const porPeso: Degrau =
    peso <= 2 ? "xs" : peso <= 4 ? "sm" : peso <= 6 ? "md" : peso <= 14 ? "lg" : "xl";

  return degrauMaior(porPeso, piso);
}
