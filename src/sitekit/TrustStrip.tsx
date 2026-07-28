/**
 * Faixa de garantias ("pronto em minutos", "sem cartão", …) como DADO.
 *
 * Era um array chumbado dentro do `VerticalLanding`, com promessas de cartório
 * self-serve aparecendo em segmento que nem self-serve é. Agora vem do conteúdo:
 * a IA e o editor escolhem as 4 garantias que fazem sentido pro segmento, o
 * ícone é NOME (string no banco, ver `icons.ts`) e o texto passa pela tradução
 * junto com o resto do conteúdo.
 *
 * O visual é exatamente o que já estava no ar (ícone na cor principal + título +
 * descrição, 2 colunas no celular / 4 no desktop). Sem itens, cai no padrão.
 *
 * RSC-safe: sem hooks, sem handlers.
 */
import { Box, HStack, SimpleGrid, Stack, Text } from "../primitives";
import { resolveSiteIcon } from "./icons";
import { resolveSiteTheme, type SiteTheme } from "./theme";

export type TrustItem = {
  /** Nome do ícone no registry (`icons.ts`). Desconhecido → Sparkles. */
  icon?: string;
  title: string;
  desc?: string;
};

/**
 * Padrão de quem vende self-serve (o que a landing mostrava chumbado).
 * Segmento sem `trust` salvo continua idêntico ao que estava no ar.
 */
export const DEFAULT_TRUST_SELF_SERVE: TrustItem[] = [
  { icon: "zap", title: "Pronto em minutos", desc: "Crie e já acesse o painel" },
  { icon: "credit-card", title: "Sem cartão", desc: "Teste antes de pagar" },
  { icon: "shield", title: "Dados isolados", desc: "Banco exclusivo seu" },
  { icon: "headphones", title: "Suporte humano", desc: "De quem entende do seu negócio" },
];

/**
 * Padrão de quem vende com atendimento. "Sem cartão"/"crie agora" seriam
 * promessa falsa aqui — o CTA abre conversa, não cadastro.
 */
export const DEFAULT_TRUST_ATENDIMENTO: TrustItem[] = [
  { icon: "handshake", title: "Feito com você", desc: "Configuramos junto, do seu jeito" },
  { icon: "zap", title: "No ar rápido", desc: "Dias, não meses" },
  { icon: "shield", title: "Dados isolados", desc: "Banco exclusivo seu" },
  { icon: "headphones", title: "Suporte humano", desc: "De quem entende do seu negócio" },
];

export function TrustStrip({
  items,
  theme,
  translate,
  defaults = DEFAULT_TRUST_SELF_SERVE,
}: {
  items?: TrustItem[] | null;
  theme?: SiteTheme | null;
  /** Tradutor do chrome — só usado no PADRÃO (conteúdo salvo já chega traduzido). */
  translate?: (s: string) => string;
  /**
   * Padrão quando não há nada salvo. Quem NÃO é self-serve deve passar
   * `DEFAULT_TRUST_ATENDIMENTO` — "sem cartão"/"crie agora" ali é promessa falsa.
   */
  defaults?: TrustItem[];
}) {
  const t = resolveSiteTheme(theme);
  const saved = items?.filter((i) => i?.title?.trim()) ?? [];
  const usingDefault = saved.length === 0;
  const list = usingDefault ? defaults : saved.slice(0, 4);
  const tr = (s: string) => (usingDefault && translate ? translate(s) : s);

  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
      {list.map((item, i) => {
        const Icon = resolveSiteIcon(item.icon);
        return (
          <HStack key={i} gap={2.5} align="center">
            <Box color={t.primary} flexShrink={0}>
              <Icon size={20} />
            </Box>
            <Stack gap={0}>
              <Text fontSize="sm" fontWeight="700" color={t.ink}>
                {tr(item.title)}
              </Text>
              {item.desc ? (
                <Text fontSize="xs" color={t.soft}>
                  {tr(item.desc)}
                </Text>
              ) : null}
            </Stack>
          </HStack>
        );
      })}
    </SimpleGrid>
  );
}
