"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { Box, Flex } from "../primitives";
import { IconButton } from "./controls";
import { useUiTextos } from "../provider/textos";

/**
 * Moldura de REORDENAR/OCULTAR em modo edição — o painel que a pessoa arruma
 * (cards do dashboard, blocos de uma página, seções de um site).
 *
 * Fora do modo edição ela devolve o filho INTOCADO: sem `Box` em volta, sem
 * mudar a árvore. É o que permite embrulhar qualquer cartão existente sem
 * mexer no layout dele nem no que já foi medido.
 *
 * Setas em vez de arrastar: arrastar não funciona em toque sem biblioteca, e
 * numa lista de 6 itens duas setas resolvem com menos código do que qualquer
 * drag-and-drop.
 */
export function CartaoOrdenavel({
  editando,
  oculto,
  aoOcultar,
  aoSubir,
  aoDescer,
  children,
}: {
  editando: boolean;
  oculto: boolean;
  aoOcultar: () => void;
  aoSubir: () => void;
  aoDescer: () => void;
  children: ReactNode;
}) {
  const textos = useUiTextos();
  if (!editando) return <>{children}</>;
  return (
    <Box position="relative" opacity={oculto ? 0.4 : 1}>
      {children}
      <Flex
        position="absolute"
        top="1.5"
        right="1.5"
        gap="0.5"
        bg="bg.panel"
        rounded="md"
        borderWidth="1px"
        borderColor="border"
        p="0.5"
        shadow="sm"
      >
        <IconButton aria-label={textos.moverAcima} size="2xs" variant="ghost" onClick={aoSubir}>
          <ArrowUp />
        </IconButton>
        <IconButton aria-label={textos.moverAbaixo} size="2xs" variant="ghost" onClick={aoDescer}>
          <ArrowDown />
        </IconButton>
        <IconButton
          aria-label={oculto ? textos.mostrar : textos.ocultar}
          size="2xs"
          variant="ghost"
          onClick={aoOcultar}
        >
          {oculto ? <Eye /> : <EyeOff />}
        </IconButton>
      </Flex>
    </Box>
  );
}
