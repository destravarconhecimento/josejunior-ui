"use client";

import { HStack } from "@chakra-ui/react";
import { Button } from "../Button";
import { ActionMenu, type ActionMenuItem } from "../ActionMenu";
import { useUiTextos } from "../../provider/textos";
import type { AcaoLinha, AcoesDeclaradas } from "./AcoesLinha";

export function AcoesDaTabela({
  acoes,
  size = "sm",
}: {
  acoes: AcoesDeclaradas;
  size?: "xs" | "sm" | "md";
}) {
  const textos = useUiTextos();
  const lista = acoes.filter((a): a is AcaoLinha => !!a && !a.oculta);
  if (lista.length === 0) return null;

  const soltas = lista.length === 1 ? lista : lista.filter((a) => a.primaria);
  const noMenu = lista.filter((a) => !soltas.includes(a));

  const itens: ActionMenuItem[] = noMenu.map((a) => ({
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
    <HStack gap={2} flexWrap="nowrap" flexShrink={0}>
      {soltas.map((a, i) => {
        const balao = a.hint ? `${a.label} — ${a.hint}` : a.label;
        const tone = a.tone ?? (a.danger ? "danger" : "primary");
        if (a.href && !a.disabled) {
          return (
            <Button key={i} asChild size={size} tone={tone} title={balao} data-testid={a.testId}>
              <a href={a.href} {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {a.icon}
                {a.label}
              </a>
            </Button>
          );
        }
        return (
          <Button
            key={i}
            type="button"
            size={size}
            tone={tone}
            title={balao}
            data-testid={a.testId}
            disabled={a.disabled}
            loading={a.loading}
            onClick={a.onClick}
          >
            {a.icon}
            {a.label}
          </Button>
        );
      })}
      {itens.length > 0 ? (
        <ActionMenu label={textos.acoes} ariaLabel={textos.acoes} size={size} tone="outline" items={itens} />
      ) : null}
    </HStack>
  );
}
