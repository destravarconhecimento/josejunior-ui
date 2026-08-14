/**
 * A ARTE 9:16 da evolução (story/feed) — uma cena PURA, sem Chakra e sem
 * "use client": o mesmo desenho serve a prévia no navegador (React) e o PNG do
 * servidor (Satori/`next/og`). Se divergissem, o que ele baixa não seria o que
 * ele viu.
 *
 * Limites do Satori respeitados de propósito:
 *  - nada de `textTransform` (o caixa-alta é feito no JS);
 *  - todo nó com mais de um filho leva `display: flex` explícito;
 *  - sem `gap` (margens explícitas) e sem `inset` (left/top/width/height);
 *  - fundo é `<img>` posicionada, não `background-image`.
 */
import type { CSSProperties, ReactElement } from "react";
import { legendaDaFoto, linhasDaEvolucao, type EvolucaoFoto } from "./types";

/** 1080×1920 = 9:16 (story). É uma tela À PARTE do papel A4 do flyer. */
export const ARTE_W = 1080;
export const ARTE_H = 1920;

/** Cor de destaque padrão da arte (o dourado do template). */
export const ARTE_DOURADO = "#d8ae42";
/** Fundo padrão (marinho) quando não há imagem de fundo. */
export const ARTE_FUNDO = "#0b1220";

export type ArteEvolucaoInput = {
  /** Chamada do topo (ex.: "Transformação real") — vai em caixa-alta. */
  chamada: string;
  titulo: string;
  subtitulo?: string | null;
  fotos: EvolucaoFoto[];
  /** Imagem de fundo (opcional) — sem ela, fica o fundo sólido da marca. */
  fundoUrl?: string | null;
  logoUrl?: string | null;
  /** Linha do rodapé (site, @perfil, telefone). */
  rodape?: string | null;
  /** Cor de destaque (moldura/legendas). */
  cor?: string | null;
  /** Cor do fundo sólido. */
  fundoCor?: string | null;
};

const linha = (style: CSSProperties): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  ...style,
});

export function arteEvolucaoTree(input: ArteEvolucaoInput): ReactElement {
  const cor = (input.cor || "").trim() || ARTE_DOURADO;
  const fundoCor = (input.fundoCor || "").trim() || ARTE_FUNDO;
  const chamada = (input.chamada || "").trim().toUpperCase();
  const titulo = (input.titulo || "").trim();
  const subtitulo = (input.subtitulo || "").trim();
  const rodape = (input.rodape || "").trim();
  const fotos = input.fotos.slice(0, 5);
  const total = fotos.length;
  const rows = linhasDaEvolucao(total);

  // --- espaço vertical: cabeçalho e rodapé têm altura conhecida; o que sobra é
  // das fotos. A célula é sempre 3:4 e encolhe junto para caber.
  const PAD = 64;
  const GAP = 18;
  const LABEL_H = 46;
  const boxW = ARTE_W - PAD * 2;
  const headerH = (chamada ? 172 : 0) + (titulo ? 86 : 0) + (subtitulo ? 64 : 0);
  const footerH = (input.logoUrl ? 132 : 0) + (rodape ? 58 : 0);
  const boxH = Math.max(320, ARTE_H - PAD * 2 - headerH - footerH - 48);

  const maxPorLinha = Math.max(...rows, 1);
  let cellW = (boxW - GAP * (maxPorLinha - 1)) / maxPorLinha;
  let cellH = (cellW * 4) / 3;
  const alturaDasFotos = boxH - rows.length * LABEL_H - GAP * (rows.length - 1);
  if (rows.length * cellH > alturaDasFotos) {
    cellH = alturaDasFotos / rows.length;
    cellW = (cellH * 3) / 4;
  }
  cellW = Math.max(80, Math.round(cellW));
  cellH = Math.max(106, Math.round(cellH));

  // Fatia as fotos nas linhas calculadas (4 → 2+2, 5 → 3+2).
  const grupos: EvolucaoFoto[][] = [];
  let cursor = 0;
  for (const qtd of rows) {
    grupos.push(fotos.slice(cursor, cursor + qtd));
    cursor += qtd;
  }

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: ARTE_W,
        height: ARTE_H,
        backgroundColor: fundoCor,
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      {input.fundoUrl ? (
        <img
          src={input.fundoUrl}
          width={ARTE_W}
          height={ARTE_H}
          style={{ position: "absolute", left: 0, top: 0, width: ARTE_W, height: ARTE_H, objectFit: "cover" }}
        />
      ) : null}
      {/* Véu escuro: garante contraste do texto sobre qualquer foto de fundo. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: ARTE_W,
          height: ARTE_H,
          backgroundColor: input.fundoUrl ? "rgba(6,10,20,0.62)" : "rgba(0,0,0,0)",
        }}
      />
      {/* Moldura dourada */}
      <div
        style={{
          position: "absolute",
          left: 26,
          top: 26,
          width: ARTE_W - 52,
          height: ARTE_H - 52,
          border: `3px solid ${cor}`,
          borderRadius: 12,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: ARTE_W,
          height: ARTE_H,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: PAD,
        }}
      >
        {/* Cabeçalho */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          {chamada ? (
            <div
              style={linha({
                fontSize: 62,
                fontWeight: 900,
                color: cor,
                letterSpacing: 2,
                lineHeight: 1.1,
                textAlign: "center",
                height: 160,
              })}
            >
              {chamada}
            </div>
          ) : null}
          {titulo ? (
            <div style={linha({ fontSize: 42, fontWeight: 700, height: 74, textAlign: "center" })}>{titulo}</div>
          ) : null}
          {subtitulo ? (
            <div
              style={linha({
                fontSize: 28,
                fontWeight: 500,
                color: "rgba(255,255,255,0.78)",
                height: 56,
                textAlign: "center",
              })}
            >
              {subtitulo}
            </div>
          ) : null}
        </div>

        {/* Fotos */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {grupos.map((grupo, gi) => (
            <div
              key={gi}
              style={{ display: "flex", alignItems: "flex-end", marginTop: gi === 0 ? 0 : GAP }}
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
                      style={linha({
                        height: LABEL_H,
                        fontSize: 26,
                        fontWeight: 800,
                        color: cor,
                        letterSpacing: 3,
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
                        objectFit: "cover",
                        borderRadius: 14,
                        border: `2px solid ${cor}`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Rodapé: logo + linha de contato */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          {input.logoUrl ? (
            <div style={linha({ height: 120 })}>
              <img src={input.logoUrl} height={100} style={{ height: 100, objectFit: "contain" }} />
            </div>
          ) : null}
          {rodape ? (
            <div style={linha({ height: 52, fontSize: 28, fontWeight: 700, color: cor, letterSpacing: 1 })}>
              {rodape}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
