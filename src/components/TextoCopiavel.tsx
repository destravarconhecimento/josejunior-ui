"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { Box, Text } from "@chakra-ui/react";
import { Check, Copy } from "lucide-react";
import { toast } from "./Toast";

/**
 * Dado que se COPIA no próprio clique (e-mail, telefone, código). Existe porque
 * em lista de trabalho a coluna de ações é sagrada — ela fica congelada à
 * direita e cada botão ali disputa a largura da lista. Copiar um e-mail não
 * merece um botão: merece que o texto seja clicável.
 *
 * O ícone só aparece no hover/foco (e logo depois de copiar): o assunto da
 * célula continua sendo o dado, não a ferramenta.
 */
export function TextoCopiavel({
  texto,
  children,
  rotulo = "Copiado",
  title,
  fontSize = "sm",
  fontWeight,
  color,
  vazio = "—",
}: {
  /** O que vai pra área de transferência. Vazio = texto morto, sem clique. */
  texto: string | null | undefined;
  /** O que aparece na tela (padrão: o próprio `texto`). */
  children?: ReactNode;
  /** Título do aviso ("E-mail copiado"). */
  rotulo?: string;
  /** Legenda do hover (padrão: `<texto> — clique para copiar`). */
  title?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  /** O que mostrar quando não há o que copiar. */
  vazio?: ReactNode;
}) {
  const [copiado, setCopiado] = useState(false);

  if (!texto) {
    return (
      <Text fontSize={fontSize} color="var(--admin-text-soft)" lineClamp={1}>
        {children ?? vazio}
      </Text>
    );
  }

  const copiar = async (e: MouseEvent) => {
    // A linha inteira pode ser clicável (abrir ficha) — copiar não abre nada.
    // O `preventDefault` faz o papel do `type="button"` (que o Box do Chakra v3
    // não aceita): dentro de um form, este clique não pode submeter nada.
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1400);
      toast.success(rotulo, texto);
    } catch {
      toast.error("Não deu pra copiar", "O navegador bloqueou a área de transferência.");
    }
  };

  return (
    <Box
      as="button"
      onClick={(e: MouseEvent) => void copiar(e)}
      title={title ?? `${texto} — clique para copiar`}
      display="inline-flex"
      alignItems="center"
      gap={1}
      minW={0}
      maxW="100%"
      textAlign="left"
      cursor="pointer"
      color={color}
      _hover={{ color: "var(--admin-primary)" }}
      css={{
        "& .jj-copiavel-icone": { opacity: copiado ? 1 : 0, transition: "opacity .12s ease" },
        "&:hover .jj-copiavel-icone, &:focus-visible .jj-copiavel-icone": { opacity: 0.7 },
      }}
    >
      <Text as="span" fontSize={fontSize} fontWeight={fontWeight} lineClamp={1} minW={0}>
        {children ?? texto}
      </Text>
      <Box as="span" className="jj-copiavel-icone" flexShrink={0} display="inline-flex">
        {copiado ? <Check size={12} /> : <Copy size={12} />}
      </Box>
    </Box>
  );
}
