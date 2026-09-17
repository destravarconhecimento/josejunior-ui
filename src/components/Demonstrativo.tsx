import type { ReactNode } from "react";
import { Box, Flex, Stack, Text } from "../primitives";

/**
 * O QUE ENTRA NUM DEMONSTRATIVO — a regra, separada do desenho.
 *
 * Linha que vale zero não ocupa espaço: gateway 0% e 1x sem parcelamento seriam
 * duas linhas dizendo "− R$ 0,00", e ruído esconde o que importa. Quem chama
 * declara `oculta` e a peça filtra; a decisão fica aqui para ter teste.
 */
export type LinhaDemonstrativo<T = string> = {
  chave: string;
  rotulo: string;
  valor: string;
  /** Total ou resultado: negrito, valor maior, separado do que veio antes. */
  destaque?: boolean;
  /** Valor indisponível ("sem custo cadastrado"): itálico e apagado. */
  apagado?: boolean;
  /** Cor do VALOR: `positivo` verde, `negativo` vermelho. Sem tom, herda. */
  tom?: "positivo" | "negativo";
  /** Linha que não deve aparecer nesta conta (valor zero, etapa inexistente). */
  oculta?: boolean;
  /** Repartição da linha (a comissão por pessoa), indentada abaixo dela. */
  sub?: { rotulo: string; valor: string }[];
  /** Conteúdo extra que quem chama quer sob a linha (aviso, nota). */
  extra?: T;
};

export function linhasVisiveis<T>(
  linhas: ReadonlyArray<LinhaDemonstrativo<T>>,
): LinhaDemonstrativo<T>[] {
  return linhas.filter((l) => !l.oculta);
}

/**
 * Lista rótulo → valor de uma CONTA: extrato de repasse, composição de preço,
 * fechamento de comissão. O valor é sempre `tabular-nums` e alinhado à direita,
 * que é o que deixa somar com o olho.
 */
export function Demonstrativo({
  linhas,
  cabecalho,
  children,
  ...rest
}: {
  linhas: ReadonlyArray<LinhaDemonstrativo<ReactNode>>;
  cabecalho?: { rotulo: string; valor: string };
  children?: ReactNode;
} & Record<string, unknown>) {
  const visiveis = linhasVisiveis(linhas);
  return (
    <Box
      borderWidth="1px"
      borderColor="border.muted"
      borderRadius="md"
      bg="bg.subtle"
      px="3.5"
      py="3"
      {...rest}
    >
      {cabecalho && (
        <Flex justify="space-between" align="baseline" gap="3" mb="2">
          <Text fontSize="xs" color="fg.muted">
            {cabecalho.rotulo}
          </Text>
          <Text fontSize="lg" fontWeight="bold" fontVariantNumeric="tabular-nums">
            {cabecalho.valor}
          </Text>
        </Flex>
      )}
      <Stack gap="0" separator={<Box borderTopWidth="1px" borderColor="border.muted" />}>
        {visiveis.map((l) => (
          <Box key={l.chave} py={l.destaque ? "2" : "1.5"}>
            <Flex justify="space-between" gap="3" align="baseline">
              <Text
                fontSize="sm"
                color={l.destaque ? undefined : "fg.muted"}
                fontWeight={l.destaque ? "semibold" : undefined}
              >
                {l.rotulo}
              </Text>
              <Text
                fontSize={l.destaque ? "lg" : "sm"}
                fontWeight={l.destaque ? "bold" : undefined}
                textAlign="end"
                fontVariantNumeric="tabular-nums"
                color={
                  l.tom === "negativo"
                    ? "red.fg"
                    : l.tom === "positivo"
                      ? "green.fg"
                      : l.apagado
                        ? "fg.muted"
                        : undefined
                }
                fontStyle={l.apagado ? "italic" : undefined}
              >
                {l.valor}
              </Text>
            </Flex>
            {l.sub?.map((s) => (
              <Flex key={s.rotulo} justify="space-between" gap="2" pl="3" pt="0.5">
                <Text fontSize="xs" color="fg.subtle">
                  {s.rotulo}
                </Text>
                <Text fontSize="xs" color="fg.subtle" fontVariantNumeric="tabular-nums">
                  {s.valor}
                </Text>
              </Flex>
            ))}
            {l.extra}
          </Box>
        ))}
      </Stack>
      {children}
    </Box>
  );
}
