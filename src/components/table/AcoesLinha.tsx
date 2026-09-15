"use client";

import type { ReactNode } from "react";
import { HStack } from "@chakra-ui/react";
import { MoreVertical } from "lucide-react";
import { Button, type ButtonTone } from "../Button";
import { ActionMenu, type ActionMenuItem } from "../ActionMenu";
import { useUiTextos } from "../../provider/textos";

export type AcaoLinha = {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  danger?: boolean;
  tone?: ButtonTone;
  hint?: string;
  disabled?: boolean;
  loading?: boolean;
  primaria?: boolean;
  oculta?: boolean;
  testId?: string;
};

export type AcoesDeclaradas = Array<AcaoLinha | null | undefined | false>;

export const MAX_SLOTS_ACOES = 4;

const SLOT_PX = 28;
const GAP_PX = 4;
const CHAR_PX = 6.8;
const PADDING_TEXTO_PX = 18;
const SLOT_TEXTO_MAX_PX = 160;

export const LARGURA_ACOES_MINIMA = `${SLOT_PX + 24}px`;

function larguraDoSlot(a: AcaoLinha) {
  if (a.icon != null) return SLOT_PX;
  return Math.min(SLOT_TEXTO_MAX_PX, Math.round(a.label.length * CHAR_PX) + PADDING_TEXTO_PX);
}

export function repartirAcoesLinha(
  acoes: AcoesDeclaradas,
  max: number = MAX_SLOTS_ACOES,
): { visiveis: AcaoLinha[]; menu: AcaoLinha[] } {
  const lista = acoes.filter((a): a is AcaoLinha => !!a && !a.oculta);
  const principais = lista.filter((a) => a.primaria && !a.danger);
  const ordenadas = [...principais, ...lista.filter((a) => !principais.includes(a))];
  const candidatas = ordenadas.filter((a) => principais.includes(a) || a.icon != null);

  if (candidatas.length === ordenadas.length && candidatas.length <= max) {
    return { visiveis: candidatas, menu: [] };
  }

  const visiveis = candidatas.slice(0, Math.max(1, max - 1));
  return { visiveis, menu: ordenadas.filter((a) => !visiveis.includes(a)) };
}

export function larguraAcoesLinha(
  porLinha: AcoesDeclaradas[],
  { dense = false, max = MAX_SLOTS_ACOES }: { dense?: boolean; max?: number } = {},
): string {
  let maior = 0;
  for (const acoes of porLinha) {
    const { visiveis, menu } = repartirAcoesLinha(acoes, max);
    const slots = [...visiveis.map(larguraDoSlot), ...(menu.length > 0 ? [SLOT_PX] : [])];
    if (slots.length === 0) continue;
    const soma = slots.reduce((t, w) => t + w, 0) + (slots.length - 1) * GAP_PX;
    maior = Math.max(maior, soma);
  }
  if (maior === 0) return LARGURA_ACOES_MINIMA;
  return `${maior + (dense ? 16 : 24)}px`;
}

export function AcoesLinha({ acoes, max = MAX_SLOTS_ACOES }: { acoes: AcoesDeclaradas; max?: number }) {
  const textos = useUiTextos();
  const { visiveis, menu } = repartirAcoesLinha(acoes, max);
  if (visiveis.length === 0 && menu.length === 0) return null;

  const itens: ActionMenuItem[] = menu.map((a) => ({
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
    <HStack gap={`${GAP_PX}px`} justify="flex-end" flexWrap="nowrap">
      {visiveis.map((a, i) => {
        const balao = a.hint ? `${a.label} — ${a.hint}` : a.label;
        const tone = a.tone ?? (a.danger ? "danger" : "ghost");
        const forma = a.icon != null ? { h: `${SLOT_PX}px`, minW: `${SLOT_PX}px`, px: 0 } : { h: `${SLOT_PX}px` };
        const comum = {
          size: "xs" as const,
          tone,
          "aria-label": a.label,
          title: balao,
          "data-testid": a.testId,
          ...forma,
        };
        if (a.href && !a.disabled) {
          return (
            <Button key={i} asChild {...comum}>
              <a href={a.href} {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {a.icon ?? a.label}
              </a>
            </Button>
          );
        }
        return (
          <Button key={i} type="button" disabled={a.disabled} loading={a.loading} onClick={a.onClick} {...comum}>
            {a.icon ?? a.label}
          </Button>
        );
      })}
      {itens.length > 0 ? (
        <ActionMenu
          label=""
          icon={<MoreVertical size={14} />}
          ariaLabel={textos.maisAcoes}
          size="xs"
          tone="ghost"
          items={itens}
        />
      ) : null}
    </HStack>
  );
}
