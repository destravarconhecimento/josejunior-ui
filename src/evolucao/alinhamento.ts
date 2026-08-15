/**
 * Alinhamento das fotos de uma evolução — regras PURAS (sem React, sem DOM).
 *
 * O problema é FOTOGRÁFICO, não técnico: "antes" e "depois" quase nunca são
 * tiradas da mesma distância. Lado a lado na mesma altura, a pessoa aparece
 * maior numa e menor na outra, com a cabeça em alturas diferentes — e a
 * comparação, que é o produto, fica torta.
 *
 * A régua é a CABEÇA. Ela não muda de tamanho com a evolução (o corpo muda), e
 * é o que o olho usa pra julgar distância. Então: mesma altura de cabeça na
 * célula e mesmo topo de cabeça. Corpo inteiro não serve de régua — uma foto
 * cortada no joelho tem a caixa menor sem a pessoa estar mais longe, e
 * normalizar por ela ampliaria a cabeça dessa foto.
 *
 * Quem mede a cabeça é a IA (`FocoFoto`, gravado junto da foto). Sem foco em
 * TODAS as fotos da evolução, este módulo devolve `null` e a faixa cai no
 * comportamento antigo (cada célula com a proporção do arquivo).
 */

/** Retângulo em frações (0..1) do arquivo. */
export type CaixaFoco = { x: number; y: number; w: number; h: number };

/** Onde a pessoa está na foto. Medido uma vez, gravado no `photos` (jsonb). */
export type FocoFoto = {
  /** Dimensões do arquivo em px — sem elas não dá pra converter altura em largura. */
  largura: number;
  altura: number;
  corpo: CaixaFoco;
  cabeca: CaixaFoco;
  /** Os pés aparecem inteiros? (só informativo hoje) */
  pesVisiveis: boolean;
  /** Tem janelinha de vídeo/story sobreposta? (só informativo hoje) */
  pip: boolean;
};

/** A parte do arquivo que a célula mostra — mesmas frações do `<img>` recortado. */
export type JanelaFoto = { x: number; y: number; w: number; h: number };

export type AlinhamentoEvolucao = {
  /** Proporção (largura ÷ altura) da célula — IGUAL para todas as fotos. */
  aspecto: number;
  janelas: JanelaFoto[];
};

/** Onde o topo da cabeça fica na célula. 6% deixa respiro sem sobrar vazio. */
const TOPO_CABECA = 0.06;
/** Sobra lateral além da largura do corpo (braço aberto, passo pro lado). */
const FOLGA_LATERAL = 1.1;
/** Célula nunca mais estreita/larga que isto — o retrato precisa continuar retrato. */
const ASPECTO_MIN = 0.35;
const ASPECTO_MAX = 1.2;
/** Fora desta faixa a "cabeça" medida é absurda: melhor não alinhar do que alinhar errado. */
const CABECA_MIN = 0.02;
const CABECA_MAX = 0.6;

const limitar = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

const caixaOk = (c: CaixaFoco | undefined | null): c is CaixaFoco =>
  !!c &&
  [c.x, c.y, c.w, c.h].every((n) => typeof n === "number" && Number.isFinite(n)) &&
  c.w > 0 &&
  c.h > 0;

/** Saneia o que veio do banco/IA: fora do padrão vira `null` (sem alinhamento). */
export function normalizeFoco(value: unknown): FocoFoto | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<FocoFoto>;
  if (!caixaOk(v.corpo) || !caixaOk(v.cabeca)) return null;
  if (!(Number(v.largura) > 0) || !(Number(v.altura) > 0)) return null;
  const caixa = (c: CaixaFoco): CaixaFoco => {
    const x = limitar(c.x, 0, 1);
    const y = limitar(c.y, 0, 1);
    return { x, y, w: limitar(c.w, 0, 1 - x), h: limitar(c.h, 0, 1 - y) };
  };
  const corpo = caixa(v.corpo);
  const cabeca = caixa(v.cabeca);
  if (!(corpo.w > 0 && corpo.h > 0 && cabeca.w > 0 && cabeca.h > 0)) return null;
  return {
    largura: Math.round(Number(v.largura)),
    altura: Math.round(Number(v.altura)),
    corpo,
    cabeca,
    pesVisiveis: v.pesVisiveis === true,
    pip: v.pip === true,
  };
}

/**
 * A janela de cada foto e a proporção comum da célula.
 *
 * Escala: `altura da janela = altura da cabeça ÷ fH`, com o MESMO `fH` pra
 * todas — cabeça do mesmo tamanho na célula. `fH` começa na maior cabeça (essa
 * foto usa o arquivo inteiro na vertical) e sobe até caber em todo mundo;
 * subir `fH` encolhe as janelas, que é o que cria folga.
 *
 * Posição: o topo da cabeça cai sempre na mesma fração da célula; na horizontal
 * a janela centraliza no meio do CORPO (não da foto — quase ninguém posa no
 * centro exato do enquadramento).
 */
export function alinharEvolucao(focos: Array<FocoFoto | null | undefined>): AlinhamentoEvolucao | null {
  if (focos.length < 2) return null;
  const fs: FocoFoto[] = [];
  for (const f of focos) {
    if (!f || !(f.cabeca.h > CABECA_MIN && f.cabeca.h < CABECA_MAX)) return null;
    fs.push(f);
  }

  let fH = Math.max(...fs.map((f) => f.cabeca.h));
  let alturas: number[] = [];
  let topo: number | null = null;
  for (let i = 0; i < 80 && topo === null; i++) {
    alturas = fs.map((f) => f.cabeca.h / fH);
    // Piso e teto do topo pra janela não sair do arquivo em nenhuma das fotos.
    const piso = Math.max(...fs.map((f, k) => 1 - (1 - f.cabeca.y) / alturas[k]));
    const teto = Math.min(...fs.map((f, k) => f.cabeca.y / alturas[k]));
    if (teto >= piso - 1e-6) topo = limitar(TOPO_CABECA, piso, Math.max(piso, teto));
    else fH *= 1.04;
  }
  if (topo === null) return null;

  // Largura: cabe o corpo com folga, sem passar da largura do arquivo.
  const cabeNoArquivo = Math.min(...fs.map((f, k) => f.largura / (alturas[k] * f.altura)));
  const cabeOCorpo = Math.max(...fs.map((f, k) => (f.corpo.w * f.largura) / (alturas[k] * f.altura)));
  const aspecto = limitar(Math.min(cabeOCorpo * FOLGA_LATERAL, cabeNoArquivo), ASPECTO_MIN, ASPECTO_MAX);

  const janelas = fs.map((f, k) => {
    const h = limitar(alturas[k], 0, 1);
    const w = limitar((h * f.altura * aspecto) / f.largura, 0, 1);
    const centro = f.corpo.x + f.corpo.w / 2;
    return {
      x: limitar(centro - w / 2, 0, 1 - w),
      y: limitar(f.cabeca.y - topo * h, 0, 1 - h),
      w,
      h,
    };
  });

  return { aspecto: Math.round(aspecto * 1000) / 1000, janelas };
}
