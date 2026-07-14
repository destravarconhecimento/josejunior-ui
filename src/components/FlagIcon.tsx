import { Box, chakra } from "@chakra-ui/react";

/**
 * Bandeira de país em SVG INLINE (sem lib, sem emoji). Emoji de bandeira não
 * renderiza no Windows; este componente desenha a bandeira igual em qualquer SO.
 * Suporta os países que a plataforma usa hoje (br/us/es) e cai num globo neutro
 * pra qualquer outro código. Aspecto fixo 4:3, cantinho arredondado + hairline.
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

const usStripes = () => {
  const rows = [];
  const band = 18 / 13;
  for (let i = 1; i < 13; i += 2) {
    rows.push(<rect key={i} x={0} y={i * band} width={24} height={band} fill="#fff" />);
  }
  return rows;
};

const usStars = () => {
  const dots = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      dots.push(<circle key={`${r}-${c}`} cx={1.6 + c * 3.1} cy={1.6 + r * 2.9} r={0.6} fill="#fff" />);
    }
  }
  return dots;
};

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
  // EUA: 13 listras + cantão azul com estrelas.
  us: (
    <>
      <rect width={24} height={18} fill="#B22234" />
      {usStripes()}
      <rect width={10.5} height={(18 / 13) * 7} fill="#3C3B6E" />
      {usStars()}
    </>
  ),
  // Espanha: vermelho/amarelo(dobro)/vermelho.
  es: (
    <>
      <rect width={24} height={18} fill="#AA151B" />
      <rect y={4.5} width={24} height={9} fill="#F1BF00" />
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
