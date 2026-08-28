/**
 * A ARTE da evolução (post de Instagram) — uma cena PURA, sem Chakra e sem
 * "use client": o mesmo desenho serve a prévia no navegador (React) e o PNG do
 * servidor (Satori/`next/og`). Se divergissem, o que ele baixa não seria o que
 * ele viu.
 *
 * O molde é o template dourado que o personal já usa nos flyers: fundo quase
 * preto com faixas diagonais douradas nos cantos, moldura + cantoneiras, logo no
 * topo, a chamada grande, as fotos emolduradas com a plaquinha da legenda em
 * cima, a pílula do resultado, a régua de diferenciais, a assinatura em itálico
 * e o site do cliente fechando o rodapé.
 *
 * Limites do Satori respeitados de propósito:
 *  - nada de `textTransform` (o caixa-alta é feito no JS);
 *  - todo nó com mais de um filho leva `display: flex` explícito;
 *  - sem `gap` (margens explícitas) e sem `inset` (left/top/width/height);
 *  - dourado em texto é COR SÓLIDA (gradiente com `background-clip` não rasteriza);
 *  - fundo é `<img>` posicionada, não `background-image`;
 *  - TODA `<img>` leva width e height — sem os dois o Satori aborta o PNG com
 *    "Image size cannot be determined" (foi o que derrubou o download da logo).
 */
import type { CSSProperties, ReactElement } from "react";
import { legendaDaFoto, linhasDaEvolucao, type EvolucaoFoto } from "./types";

/** Formatos de publicação. O feed (4:5) é o padrão — é o que rende no Instagram. */
export type ArteFormato = "feed" | "story";

export const ARTE_DIMENSOES: Record<ArteFormato, { w: number; h: number }> = {
  feed: { w: 1080, h: 1350 },
  story: { w: 1080, h: 1920 },
};

export const ARTE_FORMATO_PADRAO: ArteFormato = "feed";
/** Largura (igual nos dois formatos) e altura do formato padrão. */
export const ARTE_W = ARTE_DIMENSOES.feed.w;
export const ARTE_H = ARTE_DIMENSOES.feed.h;

/** Cor de destaque padrão da arte (o dourado do template). */
export const ARTE_DOURADO = "#d8ae42";
/** Fundo padrão (quase preto) quando não há imagem de fundo. */
export const ARTE_FUNDO = "#080b14";

/** Assinatura padrão do rodapé — a mesma linha do template do flyer. */
export const ARTE_ASSINATURA = "Transformações reais, construídas com método, disciplina e consistência.";

/** Régua de diferenciais do rodapé (o mesmo texto do template). */
export const ARTE_DESTAQUES = [
  "PLANO PERSONALIZADO",
  "TREINAMENTO EFICIENTE",
  "ACOMPANHAMENTO CONTÍNUO",
  "RESULTADOS COMPROVADOS",
];

export type ArteEvolucaoInput = {
  /** Chamada do topo (ex.: "Transformação real") — vai em caixa-alta. */
  chamada: string;
  titulo: string;
  subtitulo?: string | null;
  fotos: EvolucaoFoto[];
  /** Imagem de fundo (opcional) — sem ela, fica o fundo do template. */
  fundoUrl?: string | null;
  logoUrl?: string | null;
  /**
   * Proporção (largura ÷ altura) da logo. O navegador mede a imagem sozinho, o
   * Satori NÃO — quem rasteriza mede antes e manda o número aqui.
   */
  logoRatio?: number | null;
  /**
   * Assinatura do rodapé. Ausente (null/undefined) = a do template; string VAZIA
   * = sem rodapé nenhum (assinatura, régua de diferenciais e site somem) — é o
   * que o cliente quer quando limpa o campo pra postar a foto "limpa".
   */
  rodape?: string | null;
  /** Site do cliente, impresso na última linha (ex.: "luandavyson.com.br"). */
  site?: string | null;
  /** Cor de destaque (moldura/legendas/chamada). */
  cor?: string | null;
  /** Cor do fundo sólido. */
  fundoCor?: string | null;
  /** 4:5 (feed, padrão) ou 9:16 (story). */
  formato?: ArteFormato;
};

export function arteDimensoes(formato?: ArteFormato) {
  return ARTE_DIMENSOES[formato ?? ARTE_FORMATO_PADRAO];
}

const centro = (style: CSSProperties): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  ...style,
});

/** Quebra o texto em `k` linhas equilibradas (aproximação por nº de caracteres). */
function quebrar(palavras: string[], k: number): string[] {
  if (k <= 1) return [palavras.join(" ")];
  const alvo = palavras.join(" ").length / k;
  const linhas: string[] = [];
  let atual = "";
  for (const p of palavras) {
    const cand = atual ? `${atual} ${p}` : p;
    if (atual && cand.length > alvo && linhas.length < k - 1) {
      linhas.push(atual);
      atual = p;
    } else {
      atual = cand;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

type Encaixe = { linhas: string[]; font: number; alturaLinha: number; altura: number };

/**
 * Escolhe a quebra + o corpo da fonte que CABEM na largura dada, e devolve a
 * altura que o bloco vai ocupar. É o que acabou com a linha estourando a caixa
 * (e caindo em cima da de baixo): a régua vertical passa a ser calculada com a
 * altura real do texto, não com um número chutado.
 *
 * A medida é uma estimativa por caractere (`fator` × corpo da fonte) porque nem
 * o Satori nem o React medem texto aqui — por isso os fatores são conservadores:
 * caixa-alta é mais larga que caixa-baixa.
 */
function encaixar(
  texto: string,
  largura: number,
  o: {
    max: number;
    min: number;
    maxLinhas: number;
    /** Largura média do caractere em frações do corpo da fonte. */
    fator?: number;
    entrelinha?: number;
    /** Teto menor quando o texto quebra (2+ linhas grandes viram um paredão). */
    capMultilinha?: number;
    /** Fração do teto que já se considera "grande o bastante" (evita quebrar à toa). */
    alvo?: number;
  },
): Encaixe {
  const fator = o.fator ?? 0.62;
  const entrelinha = o.entrelinha ?? 1.2;
  const alvo = o.alvo ?? 0.78;
  const palavras = texto.split(/\s+/).filter(Boolean);
  let linhas = [texto];
  let font = o.min;
  const maxK = Math.max(1, Math.min(o.maxLinhas, palavras.length));
  for (let k = 1; k <= maxK; k++) {
    linhas = quebrar(palavras, k);
    const maior = Math.max(1, ...linhas.map((l) => l.length));
    const teto = k > 1 && o.capMultilinha ? Math.min(o.max, o.capMultilinha) : o.max;
    font = Math.max(o.min, Math.min(teto, Math.floor(largura / (maior * fator))));
    if (font >= teto * alvo) break;
  }
  const alturaLinha = Math.round(font * entrelinha);
  return { linhas, font, alturaLinha, altura: alturaLinha * linhas.length };
}

/** Bloco de texto de N linhas (uma `div` por linha: o espaçamento é meu, não do engine). */
function linhasTexto(linhas: string[], alturaLinha: number, style: CSSProperties) {
  return linhas.map((linha, i) => (
    <div
      key={`${i}-${linha}`}
      style={centro({ width: "100%", height: alturaLinha, ...style })}
    >
      {linha}
    </div>
  ));
}

/** Faixa diagonal dourada dos cantos (a assinatura visual do template). */
function faixa(key: string, left: number, top: number, w: number, h: number, cor: string, op: number, giro: number) {
  return (
    <div
      key={key}
      style={{
        position: "absolute",
        left,
        top,
        width: w,
        height: h,
        backgroundColor: cor,
        opacity: op,
        transform: `rotate(${giro}deg)`,
      }}
    />
  );
}

/** Cantoneira em "L" (dois lados dourados mais grossos que a moldura). */
function cantoneira(key: string, x: number, y: number, lados: CSSProperties, cor: string) {
  return (
    <div
      key={key}
      style={{ position: "absolute", left: x, top: y, width: 84, height: 84, borderColor: cor, ...lados }}
    />
  );
}

/** Site do rodapé sem enfeite de protocolo/barra (o que o cliente digita no anúncio). */
function limparSite(v: string): string {
  return v
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");
}

export function arteEvolucaoTree(input: ArteEvolucaoInput): ReactElement {
  const { w: W, h: H } = arteDimensoes(input.formato);
  const cor = (input.cor || "").trim() || ARTE_DOURADO;
  const fundoCor = (input.fundoCor || "").trim() || ARTE_FUNDO;
  const chamada = (input.chamada || "").trim().toUpperCase();
  const titulo = (input.titulo || "").trim().toUpperCase();
  const subtitulo = (input.subtitulo || "").trim();
  const assinatura = input.rodape == null ? ARTE_ASSINATURA : input.rodape.trim();
  // Rodapé limpo de propósito (campo vazio) = a arte termina nas fotos/título.
  const temRodape = assinatura.length > 0;
  const site = temRodape ? limparSite(input.site || "") : "";
  // Não repete o endereço se ele já escreveu o site na própria assinatura.
  const mostraSite = !!site && !assinatura.toLowerCase().includes(site.toLowerCase());
  const fotos = input.fotos.slice(0, 5);
  const total = fotos.length;
  const rows = linhasDaEvolucao(total);

  // ---- Régua vertical (âncoras absolutas: previsível no Satori e no browser).
  const PAD = 68;
  const GAP = 22;
  const larguraUtil = W - PAD * 2;

  const yLogo = 44;
  const logoH = input.logoUrl ? 104 : 0;
  const yChamada = yLogo + logoH + (input.logoUrl ? 18 : 0);

  // Chamada: fonte fina e ampla (o template dourado pede leveza, não paredão).
  // Teto baixo de propósito e `alvo` folgado: assim UMA linha ganha da quebra
  // sempre que a frase couber — "TRANSFORMAÇÃO REAL" virava duas linhas gigantes
  // só porque cabia maior partida ao meio. Sobra largura pra frase mais longa.
  const ch = chamada
    ? encaixar(chamada, larguraUtil - 20, { max: 72, min: 40, maxLinhas: 2, fator: 0.68, capMultilinha: 64, alvo: 0.6, entrelinha: 1.2 })
    : null;
  const chamadaH = ch?.altura ?? 0;

  // ---- Rodapé, de baixo para cima.
  const siteH = mostraSite ? 38 : 0;
  const ySite = H - 72;
  const assinaturaH = 36;
  const yAssinatura = mostraSite ? ySite - 4 - assinaturaH : H - 74;
  const featuresH = temRodape ? 66 : 0;
  // Sem rodapé, o "chão" do bloco das fotos é a margem inferior da arte.
  const yFeatures = temRodape ? yAssinatura - 20 - featuresH : H - PAD;

  // Título (pílula) e subtítulo, com a altura REAL do texto quebrado.
  const tt = titulo
    ? encaixar(titulo, larguraUtil - 160, { max: 34, min: 20, maxLinhas: 2, fator: 0.64, alvo: 0.62, entrelinha: 1.25 })
    : null;
  const pillH = tt ? Math.max(74, tt.altura + 30) : 0;
  const st = subtitulo
    ? encaixar(subtitulo, larguraUtil - 40, { max: 27, min: 18, maxLinhas: 3, fator: 0.52, entrelinha: 1.34 })
    : null;
  const subH = st?.altura ?? 0;

  const topoBloco = yChamada + chamadaH + 26;
  const fimBloco = yFeatures - 26 - subH - (subtitulo ? 12 : 0) - pillH - (titulo ? 24 : 0);
  const alturaDisponivel = Math.max(220, fimBloco - topoBloco);

  // Plaquinha da legenda: acompanha a largura da célula (legenda longa não estoura).
  const maxPorLinha = Math.max(...rows, 1);
  const LABEL_H = maxPorLinha >= 3 ? 48 : 54;

  // Célula 3:4 de partida. Faltando altura, encolhe junto (mantém a proporção);
  // sobrando (é o caso do story), estica — a foto é `cover`, então o que acontece
  // é recorte lateral, nunca deformação. O teto é menor com 3 por linha (célula
  // estreita esticada vira uma fresta) e maior no story, que tem altura de sobra.
  const esticaMax =
    input.formato === "story" && maxPorLinha <= 2 ? 2.2 : maxPorLinha >= 3 ? 1.8 : 1.7;
  let cellW = (larguraUtil - GAP * (maxPorLinha - 1)) / maxPorLinha;
  let cellH = (cellW * 4) / 3;
  const alturaPorLinha =
    (alturaDisponivel - rows.length * (LABEL_H + 10) - GAP * (rows.length - 1)) / rows.length;
  if (cellH > alturaPorLinha) {
    cellH = alturaPorLinha;
    cellW = (cellH * 3) / 4;
  } else {
    cellH = Math.min(alturaPorLinha, cellW * esticaMax);
  }
  cellW = Math.max(90, Math.round(cellW));
  cellH = Math.max(120, Math.round(cellH));

  // Régua de diferenciais: um corpo de fonte só, escolhido pelo rótulo MAIS LONGO,
  // para os quatro caberem em UMA linha cada. Sem isso, dois deles quebravam e a
  // fileira ficava com os losangos em alturas diferentes, encostando nos fios.
  const colDestaque = Math.floor(larguraUtil / 4) - 8;
  const LS_DESTAQUE = 1;
  const maiorDestaque = Math.max(...ARTE_DESTAQUES.map((d) => d.length));
  const fontDestaque = Math.max(
    11,
    Math.min(17, Math.floor(((colDestaque * 0.96) / maiorDestaque - LS_DESTAQUE) / 0.62)),
  );

  const blocoH = rows.length * (LABEL_H + 10 + cellH) + GAP * (rows.length - 1);
  const yBloco = topoBloco + Math.max(0, Math.round((alturaDisponivel - blocoH) / 2));
  const yPill = yBloco + blocoH + 24;
  const ySub = yPill + pillH + 12;

  // Fatia as fotos nas linhas calculadas (4 → 2+2, 5 → 3+2).
  const grupos: EvolucaoFoto[][] = [];
  let cursor = 0;
  for (const qtd of rows) {
    grupos.push(fotos.slice(cursor, cursor + qtd));
    cursor += qtd;
  }

  const preto = "rgba(6,9,16,0.92)";
  // Sem width a `<img>` da logo quebra o raster; a proporção vem medida de fora.
  const logoW = input.logoRatio && input.logoRatio > 0
    ? Math.min(larguraUtil, Math.round(logoH * input.logoRatio))
    : null;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: W,
        height: H,
        backgroundColor: fundoCor,
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      {/* Fundo: imagem própria (quando escolhida) + véu para o texto respirar. */}
      {input.fundoUrl ? (
        <img
          src={input.fundoUrl}
          width={W}
          height={H}
          style={{ position: "absolute", left: 0, top: 0, width: W, height: H, objectFit: "cover" }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          backgroundImage: input.fundoUrl
            ? "linear-gradient(180deg, rgba(4,6,12,0.86) 0%, rgba(4,6,12,0.72) 45%, rgba(4,6,12,0.9) 100%)"
            : "linear-gradient(160deg, rgba(23,33,54,0.95) 0%, rgba(6,9,16,1) 52%, rgba(17,24,40,0.92) 100%)",
        }}
      />

      {/* Faixas diagonais douradas do canto inferior direito… */}
      {faixa("f5", W - 40, H - 350, 20, 520, cor, 0.95, 32)}
      {faixa("f6", W - 90, H - 320, 10, 520, cor, 0.65, 32)}
      {faixa("f7", W - 150, H - 300, 26, 520, "#1c2740", 0.9, 32)}
      {faixa("f8", W - 200, H - 280, 8, 480, cor, 0.45, 32)}
      {/* …e o espelho (180°) no canto superior esquerdo. */}
      {faixa("f1", 20, 350 - 520, 20, 520, cor, 0.95, 32)}
      {faixa("f2", 80, 320 - 520, 10, 520, cor, 0.65, 32)}
      {faixa("f3", 124, 300 - 520, 26, 520, "#1c2740", 0.9, 32)}
      {faixa("f4", 192, 280 - 480, 8, 480, cor, 0.45, 32)}

      {/* Moldura + cantoneiras */}
      <div
        style={{
          position: "absolute",
          left: 22,
          top: 22,
          width: W - 44,
          height: H - 44,
          border: `2px solid ${cor}`,
          borderRadius: 6,
          opacity: 0.85,
        }}
      />
      {cantoneira("c1", 30, 30, { borderTopWidth: 6, borderLeftWidth: 6, borderTopStyle: "solid", borderLeftStyle: "solid" }, cor)}
      {cantoneira("c2", W - 114, 30, { borderTopWidth: 6, borderRightWidth: 6, borderTopStyle: "solid", borderRightStyle: "solid" }, cor)}
      {cantoneira("c3", 30, H - 114, { borderBottomWidth: 6, borderLeftWidth: 6, borderBottomStyle: "solid", borderLeftStyle: "solid" }, cor)}
      {cantoneira("c4", W - 114, H - 114, { borderBottomWidth: 6, borderRightWidth: 6, borderBottomStyle: "solid", borderRightStyle: "solid" }, cor)}

      {/* Logo do topo */}
      {input.logoUrl ? (
        <div style={{ position: "absolute", left: PAD, top: yLogo, width: larguraUtil, height: logoH, ...centro({}) }}>
          <img
            src={input.logoUrl}
            {...(logoW ? { width: logoW, height: logoH } : { height: logoH })}
            style={
              logoW
                ? { width: logoW, height: logoH, objectFit: "contain" }
                : { height: logoH, objectFit: "contain" }
            }
          />
        </div>
      ) : null}

      {/* Chamada: traço fino, letra espaçada — o peso quem dá é o dourado. */}
      {ch ? (
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: yChamada,
            width: larguraUtil,
            height: chamadaH,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {linhasTexto(ch.linhas, ch.alturaLinha, {
            fontSize: ch.font,
            fontWeight: 500,
            color: cor,
            letterSpacing: 3,
            textShadow: "0 6px 18px rgba(0,0,0,0.55)",
          })}
        </div>
      ) : null}

      {/* Fotos + plaquinha da legenda em cima de cada uma */}
      {grupos.map((grupo, gi) => {
        if (!grupo.length) return null; // arte sem foto (todas ilegíveis) não pode virar largura negativa
        const larguraLinha = grupo.length * cellW + (grupo.length - 1) * GAP;
        const x0 = Math.round((W - larguraLinha) / 2);
        const yLinha = yBloco + gi * (LABEL_H + 10 + cellH + GAP);
        return (
          <div
            key={`linha-${gi}`}
            style={{
              position: "absolute",
              left: x0,
              top: yLinha,
              width: larguraLinha,
              height: LABEL_H + 10 + cellH,
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            {grupo.map((foto, fi) => {
              const indice = grupos.slice(0, gi).reduce((n, g) => n + g.length, 0) + fi;
              const legenda = legendaDaFoto(foto, indice, total).toUpperCase();
              const fontLabel = Math.max(
                16,
                Math.min(30, Math.floor((cellW - 30) / Math.max(4, legenda.length * 0.78))),
              );
              return (
                <div
                  key={indice}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: cellW,
                    marginLeft: fi === 0 ? 0 : GAP,
                  }}
                >
                  <div
                    style={centro({
                      width: "100%",
                      height: LABEL_H,
                      backgroundColor: preto,
                      border: `2px solid ${cor}`,
                      borderRadius: 8,
                      fontSize: fontLabel,
                      fontWeight: 600,
                      color: cor,
                      letterSpacing: 4,
                    })}
                  >
                    {legenda}
                  </div>
                  <img
                    src={foto.url}
                    width={cellW}
                    height={cellH}
                    style={{
                      width: cellW,
                      height: cellH,
                      marginTop: 10,
                      objectFit: "cover",
                      borderRadius: 10,
                      border: `3px solid ${cor}`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Pílula do resultado (o título da evolução, editável na hora de baixar) */}
      {tt ? (
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: yPill,
            width: larguraUtil,
            height: pillH,
            ...centro({}),
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              maxWidth: larguraUtil - 20,
              height: pillH,
              paddingLeft: 46,
              paddingRight: 46,
              backgroundColor: preto,
              border: `2px solid ${cor}`,
              borderRadius: 999,
            }}
          >
            {linhasTexto(tt.linhas, tt.alturaLinha, {
              fontSize: tt.font,
              fontWeight: 600,
              color: cor,
              letterSpacing: 2,
            })}
          </div>
        </div>
      ) : null}

      {/* Subtítulo (a linha de detalhe, também editável antes de baixar) */}
      {st ? (
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: ySub,
            width: larguraUtil,
            height: subH,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {linhasTexto(st.linhas, st.alturaLinha, {
            fontSize: st.font,
            fontWeight: 500,
            color: "rgba(255,255,255,0.84)",
          })}
        </div>
      ) : null}

      {/* Régua de diferenciais */}
      {temRodape ? (
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: yFeatures,
          width: larguraUtil,
          height: featuresH,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `1px solid rgba(216,174,66,0.35)`,
          borderBottom: `1px solid rgba(216,174,66,0.35)`,
        }}
      >
        {ARTE_DESTAQUES.map((d, i) => (
          <div
            key={d}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: colDestaque,
              marginLeft: i === 0 ? 0 : 8,
            }}
          >
            <div
              style={{
                width: 11,
                height: 11,
                backgroundColor: cor,
                transform: "rotate(45deg)",
                marginBottom: 9,
              }}
            />
            <div
              style={centro({
                width: "100%",
                height: fontDestaque + 6,
                fontSize: fontDestaque,
                fontWeight: 600,
                color: "rgba(255,255,255,0.9)",
                letterSpacing: LS_DESTAQUE,
              })}
            >
              {d}
            </div>
          </div>
        ))}
      </div>
      ) : null}

      {/* Assinatura */}
      {temRodape ? (
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: yAssinatura,
          width: larguraUtil,
          height: assinaturaH,
          ...centro({
            fontSize: 21,
            fontStyle: "italic",
            fontWeight: 500,
            color: "rgba(255,255,255,0.7)",
          }),
        }}
      >
        {assinatura}
      </div>
      ) : null}

      {/* Site do cliente — a chamada para ação do rodapé */}
      {mostraSite ? (
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: ySite,
            width: larguraUtil,
            height: siteH,
            ...centro({
              fontSize: 24,
              fontWeight: 600,
              color: cor,
              letterSpacing: 3,
            }),
          }}
        >
          {site.toUpperCase()}
        </div>
      ) : null}
    </div>
  );
}
