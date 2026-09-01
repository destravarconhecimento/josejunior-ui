"use client";

import type { ReactNode } from "react";
import { HStack } from "@chakra-ui/react";
import { MoreVertical } from "lucide-react";
import { Button } from "../Button";
import { ActionMenu, type ActionMenuItem } from "../ActionMenu";

export type AcaoLinha = {
  /** Nome da ação. Vira `aria-label`/`title` do botão-ícone e o rótulo no menu. */
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  /** abre o href em nova guia */
  external?: boolean;
  danger?: boolean;
  /** Frase do que a ação faz — vai pro balão do mouse (`title`). */
  hint?: string;
  /**
   * Desabilitada FICA NO LUGAR (esmaecida), não some: a operadora acha a ação
   * pela posição, e botão que muda de casa a cada linha foi reclamação real.
   */
  disabled?: boolean;
  /** Candidata a botão visível. Sem nenhuma marcada, valem as primeiras. */
  primaria?: boolean;
  /** Não renderiza (mais limpo que montar o array condicionalmente na tela). */
  oculta?: boolean;
};

/**
 * Célula de ações PADRÃO da DataTable: no máximo `max` botões-ícone visíveis
 * (sempre os mesmos, na mesma posição) + menu "⋮" com o resto, com rótulo por
 * extenso. Use na prop `actions` da DataTable — a coluna já nasce congelada à
 * direita; com 2 botões + "⋮" ela tem largura fixa e nunca estoura a célula
 * (`actionsWidth` ~"120px").
 */
export function AcoesLinha({
  acoes,
  max = 2,
}: {
  /** `null`/`false` são descartados — dá pra escrever `cond && {...}` direto. */
  acoes: Array<AcaoLinha | null | undefined | false>;
  max?: number;
}) {
  const lista = acoes.filter((a): a is AcaoLinha => !!a && !a.oculta);
  if (lista.length === 0) return null;

  const marcadas = lista.filter((a) => a.primaria);
  const visiveis = (marcadas.length > 0 ? marcadas : lista).slice(0, max);
  const doMenu = lista.filter((a) => !visiveis.includes(a));

  const itens: ActionMenuItem[] = doMenu.map((a) => ({
    label: a.label,
    hint: a.hint,
    icon: a.icon,
    onClick: a.onClick,
    href: a.href,
    external: a.external,
    danger: a.danger,
    disabled: a.disabled,
  }));

  return (
    <HStack gap={1} justify="flex-end" flexWrap="nowrap">
      {visiveis.map((a, i) => {
        const balao = a.hint ? `${a.label} — ${a.hint}` : a.label;
        if (a.href && !a.disabled) {
          return (
            <Button key={i} asChild size="xs" tone={a.danger ? "danger" : "ghost"} aria-label={a.label} title={balao}>
              <a href={a.href} {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {a.icon ?? a.label}
              </a>
            </Button>
          );
        }
        return (
          <Button
            key={i}
            size="xs"
            tone={a.danger ? "danger" : "ghost"}
            aria-label={a.label}
            title={balao}
            disabled={a.disabled}
            onClick={a.onClick}
          >
            {a.icon ?? a.label}
          </Button>
        );
      })}
      {itens.length > 0 ? (
        <ActionMenu label="" icon={<MoreVertical size={14} />} ariaLabel="Mais ações" size="xs" tone="ghost" items={itens} />
      ) : null}
    </HStack>
  );
}
