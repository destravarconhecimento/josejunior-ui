"use client";

import type { ReactNode } from "react";
import { Flex } from "../primitives";
import { Textarea } from "./controls";

/**
 * O COMPOSER: a caixa de escrever de um chat (WhatsApp, e-mail, a conversa com
 * a IA). Até hoje ele só existia embutido no `WhatsAppClient` e no `MailClient`
 * — e cada tela nova que precisava escrever algo copiava o bloco.
 *
 * O que ele carrega e um `Textarea` solto não tem:
 *  · **Enter envia, Shift+Enter quebra linha** — a convenção de todo chat;
 *  · **colar arquivo** (print da tela) vira `aoColarArquivos`, não texto;
 *  · cresce com o conteúdo até um teto e então rola por dentro;
 *  · a moldura reage ao foco do que está DENTRO (`_focusWithin`), então o
 *    botão de anexo à esquerda e o de enviar à direita ficam na mesma caixa.
 */
export function CaixaDeMensagem({
  valor,
  aoMudar,
  aoEnviar,
  aoColarArquivos,
  placeholder,
  rotulo,
  desabilitado = false,
  autoFoco = false,
  linhas = 1,
  alturaMax = "9rem",
  antes,
  depois,
  ...rest
}: {
  valor: string;
  aoMudar: (valor: string) => void;
  aoEnviar?: () => void;
  aoColarArquivos?: (arquivos: File[]) => void;
  placeholder?: string;
  rotulo?: string;
  desabilitado?: boolean;
  autoFoco?: boolean;
  linhas?: number;
  alturaMax?: string;
  /** Dentro da moldura, antes do texto: anexar, gravar áudio, emoji. */
  antes?: ReactNode;
  /** Dentro da moldura, depois do texto: o botão de enviar. */
  depois?: ReactNode;
} & Record<string, unknown>) {
  return (
    <Flex
      align="flex-end"
      gap="1"
      borderWidth="1px"
      borderColor="border"
      rounded="2xl"
      bg="bg"
      px="1"
      py="1"
      _focusWithin={{ borderColor: "var(--admin-primary)" }}
      {...rest}
    >
      {antes}
      <Textarea
        value={valor}
        onChange={(e) => aoMudar(e.currentTarget.value)}
        placeholder={placeholder}
        aria-label={rotulo ?? placeholder}
        rows={linhas}
        autoresize
        autoFocus={autoFoco}
        disabled={desabilitado}
        minH="2.25rem"
        maxH={alturaMax}
        flex="1"
        border="none"
        _focus={{ boxShadow: "none" }}
        resize="none"
        alignSelf="center"
        py="1.5"
        onPaste={(e) => {
          if (!aoColarArquivos) return;
          const arquivos = Array.from(e.clipboardData?.files ?? []);
          if (arquivos.length === 0) return;
          e.preventDefault();
          aoColarArquivos(arquivos);
        }}
        onKeyDown={(e) => {
          if (!aoEnviar) return;
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            aoEnviar();
          }
        }}
      />
      {depois}
    </Flex>
  );
}
