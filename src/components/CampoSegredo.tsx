"use client";

import { useState } from "react";
import { Copy, Eye, EyeOff } from "lucide-react";
import { Box, Flex, Text } from "../primitives";
import { IconButton } from "./controls";
import { useCopiar } from "./TextoCopiavel";
import { useUiTextos } from "../provider/textos";

/**
 * Valor SECRETO numa ficha (token, chave de API, senha de aplicativo): mostrado
 * mascarado, com um olho para revelar e um botão para copiar.
 *
 * Os dois botões existem por motivos diferentes. Copiar é o que a pessoa quer
 * em 9 de 10 vezes — e copiar não precisa revelar, então o segredo não fica na
 * tela atrás de ninguém. O olho é para conferir o começo do valor quando a
 * ligação com o outro lado falhou.
 *
 * A máscara tem largura própria (8 a 24 pontos): repetir o tamanho exato do
 * segredo conta o comprimento dele a quem estiver olhando.
 */
export function CampoSegredo({
  label,
  valor,
  vazio,
}: {
  label: string;
  valor?: string | null;
  vazio?: string;
}) {
  const textos = useUiTextos();
  const copiar = useCopiar();
  const [revelado, setRevelado] = useState(false);
  const v = valor?.trim() || "";
  const mostrado = !v
    ? (vazio ?? textos.semValor)
    : revelado
      ? v
      : "•".repeat(Math.min(24, Math.max(8, v.length)));
  return (
    <Flex
      justify="space-between"
      align="center"
      gap="3"
      py="2.5"
      px="1"
      borderBottomWidth="1px"
      borderColor="border.muted"
    >
      <Box minW="0">
        <Text
          fontSize="2xs"
          color="fg.muted"
          textTransform="uppercase"
          letterSpacing="wider"
          fontWeight="semibold"
        >
          {label}
        </Text>
        <Text
          fontSize="sm"
          fontWeight="medium"
          fontFamily={v ? "mono" : undefined}
          lineClamp="1"
          wordBreak="break-all"
        >
          {mostrado}
        </Text>
      </Box>
      <Flex gap="1" flexShrink="0">
        <IconButton
          aria-label={revelado ? textos.ocultar : textos.revelar}
          title={revelado ? textos.ocultar : textos.revelar}
          size={{ base: "sm", md: "xs" }}
          variant="ghost"
          disabled={!v}
          onClick={() => setRevelado((r) => !r)}
        >
          {revelado ? <EyeOff /> : <Eye />}
        </IconButton>
        <IconButton
          aria-label={textos.copiar}
          title={textos.copiar}
          size={{ base: "sm", md: "xs" }}
          variant="ghost"
          disabled={!v}
          onClick={() => copiar(v, textos.copiado)}
        >
          <Copy />
        </IconButton>
      </Flex>
    </Flex>
  );
}
