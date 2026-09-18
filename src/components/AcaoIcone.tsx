"use client";

import type { ReactNode } from "react";
import { IconButton } from "@chakra-ui/react";
import { LinkDaUi } from "./LinkDaUi";
import { TONE_DO_PAPEL, type PapelDeBotao } from "./Button";

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
  tone,
  papel,
  paleta,
  ativo = false,
  redondo = false,
  title,
  ariaLabel,
  onClick,
  href,
  loading,
  disabled,
  size = "xs",
  children,
  ...rest
}: {
  tone?: AcaoTone;
  /**
   * Quando a ação NÃO tem um significado do vocabulário acima (é um "editar",
   * um "excluir", um "ver"), o eixo é o PAPEL — principal, secundário,
   * perigoso, discreto. Um dos dois, nunca os dois: `tone` diz o que a ação
   * significa, `papel` diz que peso ela tem na tela.
   */
  papel?: PapelDeBotao;
  /**
   * Cor explícita, para o botão cujo ESTADO tem cor própria e não cabe nos
   * tons acima: o anexo aberto em verde, a gravação em vermelho, a IA em roxo.
   * Vale junto com `ativo` — é ela que pinta o "ligado".
   */
  paleta?: string;
  /** Estado LIGADO (o filtro que está valendo, a coluna ordenada). */
  ativo?: boolean;
  redondo?: boolean;
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
  size?: "2xs" | "xs" | "sm" | "md" | { base: "2xs" | "xs" | "sm" | "md"; md: "2xs" | "xs" | "sm" | "md" };
  children: ReactNode;
} & Record<string, unknown>) {
  const t = TONES[tone ?? "neutro"];
  // `papel` manda quando vem; senão vale o significado (`tone`), e o padrão
  // continua sendo o neutro de antes.
  const porPapel = papel
    ? {
        variant: ({ primary: "solid", outline: "outline", ghost: "ghost", danger: "outline", whatsapp: "solid" } as const)[
          TONE_DO_PAPEL[papel]
        ],
        colorPalette: papel === "perigoso" ? "red" : papel === "principal" ? "brand" : "gray",
      }
    : null;
  const comum = {
    "aria-label": ariaLabel ?? title,
    title,
    size,
    rounded: redondo ? "full" : undefined,
    ...(ativo
      ? { variant: "subtle" as const, colorPalette: paleta ?? "brand" }
      : (porPapel ?? { variant: "ghost" as const, color: t.color, _hover: { bg: t.hover, color: t.color } })),
    // `paleta` explícita vence a do papel também no estado normal
    ...(paleta && !ativo ? { colorPalette: paleta } : {}),
    loading,
    disabled,
    // o resto vai para o botão: `display` responsivo, `data-testid`, `mt`…
    // sem isto a tela que precisa esconder o botão no celular teria de
    // embrulhá-lo num Box só para conseguir uma prop de layout.
    ...rest,
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
