"use client";

import type { ReactNode } from "react";
import { IconButton } from "@chakra-ui/react";
import { LinkDaUi } from "./LinkDaUi";

/**
 * A COR diz o que o botão faz. Numa lista de trabalho (funil, atendimento) os
 * ícones ficam todos iguais em cinza e a pessoa clica no errado — o custo disso
 * é um contato registrado que nunca aconteceu. Aqui o vocabulário é fixo e vale
 * pra tela inteira:
 *
 *  - `whatsapp` (verde)   → mandar mensagem no WhatsApp
 *  - `ligar`    (azul)    → ligação / telefone
 *  - `ia`       (roxo)    → a IA gera algo (proposta, texto)
 *  - `agenda`   (âmbar)   → marcar/mudar data (nada acontece agora)
 *  - `confirmar`(verde)   → avança o estado (feito · contatei · respondeu)
 *  - `negar`    (vermelho)→ resultado negativo (sem resposta · não é WhatsApp)
 *  - `neutro`   (cinza)   → inócuo (copiar, ver)
 */
export type AcaoTone =
  | "whatsapp"
  | "ligar"
  | "ia"
  | "agenda"
  | "confirmar"
  | "negar"
  | "neutro";

const TONES: Record<AcaoTone, { color: string; hover: string }> = {
  whatsapp: { color: "#16a34a", hover: "rgba(22,163,74,0.12)" },
  ligar: { color: "#2563eb", hover: "rgba(37,99,235,0.12)" },
  ia: { color: "#7c3aed", hover: "rgba(124,58,237,0.12)" },
  agenda: { color: "#d97706", hover: "rgba(217,119,6,0.14)" },
  confirmar: { color: "#15803d", hover: "rgba(21,128,61,0.12)" },
  negar: { color: "#dc2626", hover: "rgba(220,38,38,0.12)" },
  neutro: { color: "var(--admin-text-soft)", hover: "var(--admin-hover, rgba(15,23,42,0.06))" },
};

/**
 * Botão de ÍCONE de uma linha de lista, com a cor amarrada ao significado.
 * `title` é obrigatório: ícone sem legenda é adivinhação.
 */
export function AcaoIcone({
  tone = "neutro",
  title,
  ariaLabel,
  onClick,
  href,
  loading,
  disabled,
  size = "xs",
  children,
}: {
  tone?: AcaoTone;
  /** Legenda do hover — diz o que o clique FAZ, não o nome do ícone. */
  title: string;
  /** Padrão: o próprio `title`. */
  ariaLabel?: string;
  onClick?: () => void;
  /**
   * Ação que NAVEGA (ver a ficha, abrir o pedido). Vira um link de verdade, com
   * o `Link` do app injetado no shell: ganha o meio-clique, o "abrir em nova
   * aba" e o menu do botão direito, que um `onClick` com `router.push` engole.
   */
  href?: string;
  loading?: boolean;
  disabled?: boolean;
  size?: "xs" | "sm" | "md";
  children: ReactNode;
}) {
  const t = TONES[tone];
  const comum = {
    "aria-label": ariaLabel ?? title,
    title,
    size,
    variant: "ghost" as const,
    color: t.color,
    _hover: { bg: t.hover, color: t.color },
    loading,
    disabled,
  };
  if (href) {
    return (
      <IconButton asChild {...comum}>
        <LinkDaUi href={href}>{children}</LinkDaUi>
      </IconButton>
    );
  }
  return (
    <IconButton {...comum} onClick={onClick}>
      {children}
    </IconButton>
  );
}
