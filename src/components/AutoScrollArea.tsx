"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Table } from "../chakra-controls";

const useIsoEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Altura máxima MEDIDA: "daqui até o fim da janela, menos uma folga".
 *
 * O número mágico (`maxH="60vh"`) erra nos dois sentidos — sobra buraco embaixo
 * numa tela grande e corta a lista numa pequena, porque ele não sabe onde o
 * elemento começa. Aqui a conta é feita com a posição real do elemento e
 * refeita no `resize` e a cada mudança de tamanho do corpo (o `ResizeObserver`
 * pega o que o `resize` não vê: um filtro que abriu e empurrou a lista).
 *
 * `override` desliga a medição — é a saída para quem quer um teto fixo sem
 * trocar de componente.
 */
export function useViewportMaxH(
  ref: RefObject<HTMLElement | null>,
  {
    bottomGap = 24,
    minH = 220,
    override,
  }: { bottomGap?: number; minH?: number; override?: string } = {},
) {
  const [maxH, setMaxH] = useState<string | undefined>(override);

  useIsoEffect(() => {
    if (override) {
      setMaxH(override);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const compute = () => {
      const top = el.getBoundingClientRect().top;
      // topo ainda não posicionado (montagem/aba escondida): medir daria 0 e a
      // área nasceria no piso mínimo, piscando quando o valor certo chegasse.
      if (top < 1) return;
      const avail = window.innerHeight - top - bottomGap;
      setMaxH(`${Math.max(minH, Math.round(avail))}px`);
    };
    compute();
    window.addEventListener("resize", compute);
    const ro = new ResizeObserver(compute);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("resize", compute);
      ro.disconnect();
    };
  }, [ref, bottomGap, minH, override]);

  return maxH;
}

/**
 * Área de rolagem de TABELA presa à janela: o cabeçalho fica, o miolo rola até
 * onde a tela acaba. Para a grade embutida (matriz de permissões, conferência
 * lado a lado) — a `DataTable` de página tem o próprio regime de altura.
 */
export function AutoScrollArea({
  children,
  bottomGap = 24,
  minH = 220,
  maxH: maxHProp,
  ...rest
}: {
  children: ReactNode;
  bottomGap?: number;
  minH?: number;
  maxH?: string;
} & Record<string, unknown>) {
  const ref = useRef<HTMLDivElement>(null);
  const maxH = useViewportMaxH(ref, { bottomGap, minH, override: maxHProp });

  return (
    <Table.ScrollArea ref={ref} maxH={maxH} {...rest}>
      {children}
    </Table.ScrollArea>
  );
}
