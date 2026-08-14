/**
 * A ARTE da evolução (post de Instagram) — uma cena PURA, sem Chakra e sem
 * "use client": o mesmo desenho serve a prévia no navegador (React) e o PNG do
 * servidor (Satori/`next/og`). Se divergissem, o que ele baixa não seria o que
 * ele viu.
 *
 * O molde é o template dourado que o personal já usa nos flyers: fundo quase
 * preto com faixas diagonais douradas nos cantos, moldura + cantoneiras, logo no
 * topo, a chamada gigante, as fotos emolduradas com a plaquinha da legenda em
 * cima, a pílula do resultado, a régua de diferenciais e a assinatura em itálico.
 *
 * Limites do Satori respeitados de propósito:
 *  - nada de `textTransform` (o caixa-alta é feito no JS);
 *  - todo nó com mais de um filho leva `display: flex` explícito;
 *  - sem `gap` (margens explícitas) e sem `inset` (left/top/width/height);
 *  - dourado em texto é COR SÓLIDA (gradiente com `background-clip` não rasteriza);
 *  - fundo é `<img>` posicionada, não `background-image`.
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
  /** Chamada do topo (ex.: "Resultado real") — vai em caixa-alta. */
  chamada: string;
  titulo: string;
  subtitulo?: string | null;
  fotos: EvolucaoFoto[];
  /** Imagem de fundo (opcional) — sem ela, fica o fundo do template. */
  fundoUrl?: string | null;
  logoUrl?: string | null;
  /** Assinatura do rodapé; vazia usa a do template. */
  rodape?: string | null;
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

export function arteEvolucaoTree(input: ArteEvolucaoInput): ReactElement {
  const { w: W, h: H } = arteDimensoes(input.formato);
  const cor = (input.cor || "").trim() || ARTE_DOURADO;
  const fundoCor = (input.fundoCor || "").trim() || ARTE_FUNDO;
  const chamada = (input.chamada || "").trim().toUpperCase();
  const titulo = (input.titulo || "").trim().toUpperCase();
  const subtitulo = (input.subtitulo || "").trim();
  const assinatura = (input.rodape || "").trim() || ARTE_ASSINATURA;
  const fotos = input.fotos.slice(0, 5);
  const total = fotos.length;
  const rows = linhasDaEvolucao(total);

  // ---- Régua vertical (âncoras absolutas: previsível no Satori e no browser).
  const PAD = 68;
  const GAP = 22;
  const LABEL_H = 58;
  const larguraUtil = W - PAD * 2;

  const yLogo = 46;
  const logoH = input.logoUrl ? 112 : 0;
  const yChamada = yLogo + logoH + (input.logoUrl ? 22 : 0);
  const chamadaH = chamada ? 118 : 0;

  const yAssinatura = H - 78;
  const featuresH = 74;
  const yFeatures = yAssinatura - 26 - featuresH;
  const pillH = titulo ? 78 : 0;
  const subH = subtitulo ? 46 : 0;

  const topoBloco = yChamada + chamadaH + 30;
  const fimBloco = yFeatures - 30 - subH - (subtitulo ? 12 : 0) - pillH - (titulo ? 26 : 0);
  const alturaDisponivel = Math.max(220, fimBloco - topoBloco);

  // Célula 3:4 de partida. Faltando altura, encolhe junto (mantém a proporção);
  // sobrando (é o caso do story), estica até 1:1,7 — a foto é `cover`, então o
  // que acontece é recorte, nunca deformação.
  const maxPorLinha = Math.max(...rows, 1);
  let cellW = (larguraUtil - GAP * (maxPorLinha - 1)) / maxPorLinha;
  let cellH = (cellW * 4) / 3;
  const alturaPorLinha =
    (alturaDisponivel - rows.length * (LABEL_H + 10) - GAP * (rows.length - 1)) / rows.length;
  if (cellH > alturaPorLinha) {
    cellH = alturaPorLinha;
    cellW = (cellH * 3) / 4;
  } else {
    cellH = Math.min(alturaPorLinha, cellW * 1.7);
  }
  cellW = Math.max(90, Math.round(cellW));
  cellH = Math.max(120, Math.round(cellH));

  const blocoH = rows.length * (LABEL_H + 10 + cellH) + GAP * (rows.length - 1);
  const yBloco = topoBloco + Math.max(0, Math.round((alturaDisponivel - blocoH) / 2));
  const yPill = yBloco + blocoH + 26;
  const ySub = yPill + pillH + 12;

  // Chamada: encolhe pela quantidade de letras para nunca estourar a largura.
  const fontChamada = Math.max(48, Math.min(104, Math.floor(larguraUtil / Math.max(6, chamada.length * 0.58))));
  const fontTitulo = Math.max(24, Math.min(38, Math.floor((larguraUtil - 120) / Math.max(8, titulo.length * 0.6))));
  const fontLabel = maxPorLinha >= 3 ? 26 : 32;

  // Fatia as fotos nas linhas calculadas (4 → 2+2, 5 → 3+2).
  const grupos: EvolucaoFoto[][] = [];
  let cursor = 0;
  for (const qtd of rows) {
    grupos.push(fotos.slice(cursor, cursor + qtd));
    cursor += qtd;
  }

  const preto = "rgba(6,9,16,0.92)";

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
          <img src={input.logoUrl} height={logoH} style={{ height: logoH, objectFit: "contain" }} />
        </div>
      ) : null}

      {/* Chamada gigante */}
      {chamada ? (
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: yChamada,
            width: larguraUtil,
            height: chamadaH,
            ...centro({
              fontSize: fontChamada,
              fontWeight: 900,
              color: cor,
              letterSpacing: 0,
              lineHeight: 1.05,
              // O raster só tem a fonte regular do `next/og` — o "negrito" da
              // headline é feito à mão, engrossando o traço com sombras coladas.
              textShadow: `2px 0 0 ${cor}, -2px 0 0 ${cor}, 0 2px 0 ${cor}, 0 -2px 0 ${cor}, 0 8px 18px rgba(0,0,0,0.55)`,
            }),
          }}
        >
          {chamada}
        </div>
      ) : null}

      {/* Fotos + plaquinha da legenda em cima de cada uma */}
      {grupos.map((grupo, gi) => {
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
                      fontWeight: 900,
                      color: cor,
                      letterSpacing: 4,
                    })}
                  >
                    {legendaDaFoto(foto, indice, total).toUpperCase()}
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

      {/* Pílula do resultado (o título da evolução) */}
      {titulo ? (
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
            style={centro({
              height: pillH,
              paddingLeft: 42,
              paddingRight: 42,
              backgroundColor: preto,
              border: `2px solid ${cor}`,
              borderRadius: 999,
              fontSize: fontTitulo,
              fontWeight: 900,
              color: cor,
              letterSpacing: 2,
            })}
          >
            {titulo}
          </div>
        </div>
      ) : null}

      {/* Subtítulo */}
      {subtitulo ? (
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: ySub,
            width: larguraUtil,
            height: subH,
            ...centro({ fontSize: 28, fontWeight: 600, color: "rgba(255,255,255,0.82)" }),
          }}
        >
          {subtitulo}
        </div>
      ) : null}

      {/* Régua de diferenciais */}
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
              width: Math.floor(larguraUtil / 4) - 8,
              marginLeft: i === 0 ? 0 : 8,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                backgroundColor: cor,
                transform: "rotate(45deg)",
                marginBottom: 10,
              }}
            />
            <div
              style={centro({
                width: "100%",
                fontSize: 17,
                fontWeight: 800,
                color: "rgba(255,255,255,0.9)",
                letterSpacing: 1,
                lineHeight: 1.15,
              })}
            >
              {d}
            </div>
          </div>
        ))}
      </div>

      {/* Assinatura */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: yAssinatura,
          width: larguraUtil,
          height: 46,
          ...centro({
            fontSize: 22,
            fontStyle: "italic",
            fontWeight: 500,
            color: "rgba(255,255,255,0.7)",
          }),
        }}
      >
        {assinatura}
      </div>
    </div>
  );
}
