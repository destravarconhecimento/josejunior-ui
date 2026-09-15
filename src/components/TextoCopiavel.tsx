"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import { Check, Copy } from "lucide-react";
import { toast } from "./Toast";
import { Button } from "./Button";

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

/**
 * Copiar sem depender da área de transferência assíncrona: em contexto não
 * seguro (http, webview antiga) `navigator.clipboard` nem existe, e o usuário
 * ficava sem entender por que o botão não fazia nada.
 */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = texto;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

export function useCopiar(): (texto: string, rotulo?: string) => Promise<boolean> {
  return async (texto: string, rotulo = "Copiado") => {
    const ok = await copiarTexto(texto);
    if (ok) toast.success(rotulo, texto.length > 60 ? undefined : texto);
    else toast.error("Não deu pra copiar", "O navegador bloqueou a área de transferência.");
    return ok;
  };
}

/**
 * Variante BOTÃO do copiar, pra quando o dado não está na tela (copiar o bloco
 * inteiro, a chave, o link de convite). O botão confirma em si mesmo por um
 * instante — o aviso passa, o botão fica onde a pessoa está olhando.
 */
export function BotaoCopiar({
  texto,
  rotulo,
  rotuloCopiado = "Copiado",
  size = "xs",
  tone = "outline",
  disabled,
}: {
  texto: string;
  rotulo: ReactNode;
  rotuloCopiado?: ReactNode;
  size?: "2xs" | "xs" | "sm" | "md";
  tone?: "primary" | "outline" | "ghost";
  disabled?: boolean;
}) {
  const [copiado, setCopiado] = useState(false);
  return (
    <Button
      size={size}
      tone={copiado ? "primary" : tone}
      disabled={disabled}
      onClick={async () => {
        if (!(await copiarTexto(texto))) {
          toast.error("Não deu pra copiar", "O navegador bloqueou a área de transferência.");
          return;
        }
        setCopiado(true);
        setTimeout(() => setCopiado(false), 1600);
      }}
    >
      {copiado ? <Check size={14} /> : <Copy size={14} />}
      {copiado ? rotuloCopiado : rotulo}
    </Button>
  );
}

/**
 * Linha rótulo/valor de ficha (chave de API, endereço, documento) com o copiar
 * na ponta. É o `TextoCopiavel` quando o rótulo precisa aparecer junto.
 */
export function LinhaCopiavel({
  rotulo,
  valor,
  vazio = "—",
}: {
  rotulo: string;
  valor?: string | null;
  vazio?: ReactNode;
}) {
  const copiar = useCopiar();
  const v = valor?.trim() || "";
  return (
    <Flex
      justify="space-between"
      align="center"
      gap={3}
      py={2.5}
      px={1}
      borderBottomWidth="1px"
      borderColor="var(--admin-divider)"
    >
      <Box minW={0}>
        <Text
          fontSize="10px"
          fontWeight="600"
          color="var(--admin-text-soft)"
          textTransform="uppercase"
          letterSpacing="0.04em"
        >
          {rotulo}
        </Text>
        <Text fontSize="sm" fontWeight="500" lineClamp={1}>
          {v || vazio}
        </Text>
      </Box>
      <IconButton
        aria-label={`Copiar ${rotulo}`}
        title={`Copiar ${rotulo}`}
        size={{ base: "sm", md: "xs" }}
        variant="ghost"
        disabled={!v}
        onClick={() => void copiar(v, `${rotulo} copiado`)}
      >
        <Copy size={14} />
      </IconButton>
    </Flex>
  );
}
