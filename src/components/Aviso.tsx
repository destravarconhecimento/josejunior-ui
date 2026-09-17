import type { ReactNode } from "react";
import { Box } from "../primitives";

/**
 * Caixa de aviso na TELA — a frase que explica uma regra, um estado que não é
 * erro de envio ou uma consequência ("isto vai republicar 12 anúncios").
 *
 * Não confundir com o `toaster`: o toast é a RESPOSTA de uma ação e some; o
 * aviso é contexto permanente do bloco onde ele está. Toast para responder,
 * Aviso para explicar.
 */
export type TomDeAviso = "info" | "alerta" | "erro";

const PALETA: Record<TomDeAviso, string> = { info: "blue", alerta: "orange", erro: "red" };

export function Aviso({
  tom = "info",
  children,
  ...rest
}: { tom?: TomDeAviso; children: ReactNode } & Record<string, unknown>) {
  const cor = PALETA[tom];
  return (
    <Box
      borderWidth="1px"
      borderColor={`${cor}.muted`}
      bg={`${cor}.subtle`}
      color={`${cor}.fg`}
      rounded="md"
      px="3"
      py="2"
      fontSize="xs"
      {...rest}
    >
      {children}
    </Box>
  );
}
