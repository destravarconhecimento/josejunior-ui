import { Box, Flex, Text } from "../primitives";

/**
 * Sparkline de BARRAS — a série curta que mora dentro de um card ("os últimos
 * 30 dias"), onde o `LineChart` seria grande demais e o `ProgressBar` só diz
 * uma coisa.
 *
 * A altura é relativa ao maior valor da própria série: a barra responde "qual
 * dia foi o pico", não "quanto foi o dia" — o número exato fica no `titulo` de
 * cada barra (hover) ou fora do gráfico.
 */
export type BarraDoGrafico = {
  chave: string;
  valor: number;
  /** Barra que se destaca da série (hoje, o dia escolhido, o recorde). */
  destaque?: boolean;
  /** Legenda do hover — sem ela a barra não diz o valor a ninguém. */
  titulo?: string;
};

export function GraficoBarras({
  barras,
  altura = "28",
  rotuloInicio,
  rotuloFim,
}: {
  barras: BarraDoGrafico[];
  altura?: string;
  rotuloInicio?: string;
  rotuloFim?: string;
}) {
  const max = Math.max(1, ...barras.map((b) => b.valor));
  return (
    <Box overflowX="auto">
      <Flex align="end" gap="1" h={altura} minW={`${barras.length * 14}px`}>
        {barras.map((b) => (
          <Box key={b.chave} flex="1" minW="2.5" title={b.titulo} position="relative">
            <Box
              bg={b.destaque ? "green.solid" : "var(--admin-primary)"}
              h={`${Math.max(2, (b.valor / max) * 100)}px`}
              rounded="sm"
            />
          </Box>
        ))}
      </Flex>
      {(rotuloInicio || rotuloFim) && (
        <Flex justify="space-between" fontSize="2xs" color="fg.subtle" mt="1">
          <Text as="span">{rotuloInicio}</Text>
          <Text as="span">{rotuloFim}</Text>
        </Flex>
      )}
    </Box>
  );
}
