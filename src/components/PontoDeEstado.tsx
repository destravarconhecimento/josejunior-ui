import { Box, type BoxProps } from "@chakra-ui/react";

export type PontoTom = "ok" | "alerta" | "inativo";

const TONS: Record<PontoTom, string> = {
  ok: "#15803d",
  alerta: "#a16207",
  inativo: "var(--admin-border-strong)",
};

export function PontoDeEstado({
  tom,
  medido = true,
  ...rest
}: { tom: PontoTom; medido?: boolean } & Omit<BoxProps, "as" | "children">) {
  const cor = TONS[tom];
  return (
    <Box
      as="span"
      display="inline-block"
      w="2"
      h="2"
      rounded="full"
      flexShrink="0"
      bg={medido ? cor : "transparent"}
      borderWidth={medido ? "0" : "1.5px"}
      borderColor={cor}
      {...rest}
    />
  );
}
