import { Box, chakra } from "@chakra-ui/react";

/**
 * Bandeira de país em SVG INLINE (sem lib, sem emoji). Emoji de bandeira não
 * renderiza no Windows; este componente desenha a bandeira igual em qualquer SO.
 * Suporta os países do catálogo de idiomas (br/gb/es/jp/fr/de/it/cn) e cai num globo neutro
 * pra qualquer outro código. Aspecto fixo 4:3, cantinho arredondado + hairline.
 * `en` usa a bandeira do REINO UNIDO (gb) — o inglês da plataforma é o britânico.
 */
export function FlagIcon({ code, size = 18 }: { code: string; size?: number }) {
  const h = Math.round((size * 3) / 4);
  return (
    <Box
      as="span"
      display="inline-flex"
      flexShrink={0}
      w={`${size}px`}
      h={`${h}px`}
      borderRadius="3px"
      overflow="hidden"
      boxShadow="0 0 0 1px rgba(0,0,0,0.10)"
      aria-hidden
    >
      <chakra.svg viewBox="0 0 24 18" width="100%" height="100%" display="block">
        {FLAGS[code] ?? FLAGS._}
      </chakra.svg>
    </Box>
  );
}

/** Bandeiras conhecidas. Cada valor é o CONTEÚDO do <svg viewBox="0 0 24 18">. */
const FLAGS: Record<string, React.ReactNode> = {
  // Brasil: campo verde, losango amarelo, círculo azul.
  br: (
    <>
      <rect width={24} height={18} fill="#009C3B" />
      <path d="M12 2.2 L21.6 9 L12 15.8 L2.4 9 Z" fill="#FFDF00" />
      <circle cx={12} cy={9} r={3.5} fill="#002776" />
    </>
  ),
  // Reino Unido (Union Jack): campo azul, saltire branca + vermelha, cruz de São
  // Jorge por cima (branca e depois vermelha). As diagonais estouram a viewBox de
  // propósito — o Box pai tem overflow="hidden" e recorta nas bordas.
  gb: (
    <>
      <rect width={24} height={18} fill="#012169" />
      <path d="M0 0 L24 18 M24 0 L0 18" stroke="#fff" strokeWidth={3.6} />
      <path d="M0 0 L24 18 M24 0 L0 18" stroke="#C8102E" strokeWidth={1.4} />
      <rect x={9} width={6} height={18} fill="#fff" />
      <rect y={6} width={24} height={6} fill="#fff" />
      <rect x={10} width={4} height={18} fill="#C8102E" />
      <rect y={7} width={24} height={4} fill="#C8102E" />
    </>
  ),
  // Japão (Hinomaru): campo branco, disco vermelho centralizado.
  jp: (
    <>
      <rect width={24} height={18} fill="#fff" />
      <circle cx={12} cy={9} r={5.4} fill="#BC002D" />
    </>
  ),
  // Espanha: vermelho/amarelo(dobro)/vermelho.
  es: (
    <>
      <rect width={24} height={18} fill="#AA151B" />
      <rect y={4.5} width={24} height={9} fill="#F1BF00" />
    </>
  ),
  // França: tricolor vertical azul/branco/vermelho.
  fr: (
    <>
      <rect width={24} height={18} fill="#fff" />
      <rect width={8} height={18} fill="#002395" />
      <rect x={16} width={8} height={18} fill="#ED2939" />
    </>
  ),
  // Alemanha: tricolor horizontal preto/vermelho/dourado.
  de: (
    <>
      <rect width={24} height={18} fill="#000" />
      <rect y={6} width={24} height={6} fill="#DD0000" />
      <rect y={12} width={24} height={6} fill="#FFCE00" />
    </>
  ),
  // Itália: tricolor vertical verde/branco/vermelho.
  it: (
    <>
      <rect width={24} height={18} fill="#fff" />
      <rect width={8} height={18} fill="#009246" />
      <rect x={16} width={8} height={18} fill="#CE2B37" />
    </>
  ),
  // China: campo vermelho, estrela dourada grande (as 4 menores somem neste tamanho).
  cn: (
    <>
      <rect width={24} height={18} fill="#DE2910" />
      <path
        d="M6 3.2 L6.9 5.9 L9.7 5.9 L7.4 7.6 L8.3 10.3 L6 8.6 L3.7 10.3 L4.6 7.6 L2.3 5.9 L5.1 5.9 Z"
        fill="#FFDE00"
      />
    </>
  ),
  // Fallback neutro: globo.
  _: (
    <>
      <rect width={24} height={18} fill="#e5e7eb" />
      <circle cx={12} cy={9} r={6} fill="none" stroke="#6b7280" strokeWidth={1.2} />
      <path d="M6 9h12M12 3c2.4 2 2.4 10 0 12M12 3c-2.4 2-2.4 10 0 12" fill="none" stroke="#6b7280" strokeWidth={1.2} />
    </>
  ),
};
