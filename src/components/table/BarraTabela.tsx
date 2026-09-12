"use client";

import { useState, type ReactNode } from "react";
import { Box, HStack, NativeSelect, Text } from "@chakra-ui/react";
import { ArrowDownUp, ListFilter, X } from "lucide-react";
import { Button } from "../Button";
import { Modal } from "../Modal";
import { Accordion } from "../Accordion";
import { FacetasLazy } from "./FiltroColunaMenu";
import { rotuloDoValor, type FiltroColuna, type ValorFaceta } from "./filtros";
import { useUiTextos } from "../../provider/textos";
import { fmtTexto, type UiTextos } from "../../textos";
import type { SortState } from "./sort";

export type ColunaOrdenavel = { key: string; rotulo: string };
export type ColunaFiltravel = {
  key: string;
  rotulo: string;
  /** Callback (lazy): computado só quando o modal mobile abre. */
  facetas: () => ValorFaceta[];
};

/** Pill de filtro ativo com X. Exportado pra quem alimenta `chipsExtras` (ex.: FunilLeadsTable). */
export function ChipFiltro({ children, onRemove, removeLabel }: { children: ReactNode; onRemove: () => void; removeLabel: string }) {
  return (
    <HStack
      gap={1}
      pl={2.5}
      pr={1.5}
      py={0.5}
      borderRadius="full"
      borderWidth="1px"
      borderColor="var(--admin-border)"
      bg="var(--admin-nav-active)"
      flexShrink={0}
      maxW="100%"
    >
      <Text fontSize="xs" fontWeight={600} lineClamp={1} color="var(--admin-text)">
        {children}
      </Text>
      <Box
        as="button"
        aria-label={removeLabel}
        title={removeLabel}
        onClick={onRemove}
        display="inline-flex"
        p="2px"
        borderRadius="full"
        color="var(--admin-text-soft)"
        _hover={{ color: "var(--admin-text)", bg: "var(--admin-nav-hover)" }}
      >
        <X size={12} />
      </Box>
    </HStack>
  );
}

/**
 * Estado combinado dos filtros/ordenação da DataTable, DENTRO do box medido da
 * toolbar (o sticky do `thead` se ajusta sozinho quando os chips aparecem).
 *
 * Desktop: só a linha de chips (o th tem o funil e o clique de ordenar).
 * Mobile (o th não existe — a tabela vira cards): ganha um select "Ordenar" e um
 * botão "Filtrar" que abre modal com as colunas em acordeão.
 */
export function BarraTabela({
  ordenaveis,
  filtraveis,
  sort,
  onSortChange,
  filtros,
  onFiltroChange,
  onLimparTudo,
  chipsExtras,
  textos,
  filtrosEmSheet = true,
}: {
  ordenaveis: ColunaOrdenavel[];
  filtraveis: ColunaFiltravel[];
  sort: SortState | null;
  onSortChange: (s: SortState | null) => void;
  filtros: FiltroColuna[];
  onFiltroChange: (key: string, valores: string[] | null) => void;
  onLimparTudo: () => void;
  /** Chips de filtros que vivem FORA das colunas (ex.: blocos do dia no funil). */
  chipsExtras?: ReactNode;
  /** Strings já resolvidas pela DataTable; sem elas vem do contexto/pt-BR. */
  textos?: UiTextos;
  /** false = as colunas em acordeão abrem NA PÁGINA, não num modal. */
  filtrosEmSheet?: boolean;
}) {
  const t = useUiTextos(textos);
  const [modalFiltro, setModalFiltro] = useState(false);

  const ativos = filtros.filter((f) => f.valores.length > 0);
  const temControles = ordenaveis.length > 0 || filtraveis.length > 0;
  const temChips = ativos.length > 0 || sort != null || chipsExtras != null;
  if (!temControles && !temChips) return null;

  const rotuloDe = (key: string) =>
    filtraveis.find((c) => c.key === key)?.rotulo ?? ordenaveis.find((c) => c.key === key)?.rotulo ?? key;

  const chips = temChips ? (
    <HStack px={3} py={1.5} gap={1.5} flexWrap="wrap" borderBottomWidth="1px" borderColor="var(--admin-divider)">
      {chipsExtras}
      {ativos.map((f) => (
        <ChipFiltro key={f.key} onRemove={() => onFiltroChange(f.key, null)} removeLabel={fmtTexto(t.tirarFiltroDe, { coluna: rotuloDe(f.key) })}>
          {rotuloDe(f.key)}:{" "}
          {f.valores.length === 1
            ? rotuloDoValor(f.valores[0], undefined, t)
            : fmtTexto(t.valoresContagem, { n: f.valores.length })}
        </ChipFiltro>
      ))}
      {sort ? (
        <ChipFiltro onRemove={() => onSortChange(null)} removeLabel={t.ordemPadraoVoltar}>
          {fmtTexto(t.ordemChip, { coluna: rotuloDe(sort.key), seta: sort.dir === "asc" ? "↑" : "↓" })}
        </ChipFiltro>
      ) : null}
      {ativos.length + (sort ? 1 : 0) >= 2 ? (
        <Button size="xs" tone="ghost" onClick={onLimparTudo}>
          {t.limparTudo}
        </Button>
      ) : null}
    </HStack>
  ) : null;

  const controlesMobile = temControles ? (
    <HStack
      display={{ base: "flex", md: "none" }}
      px={3}
      py={2}
      gap={2}
      borderBottomWidth="1px"
      borderColor="var(--admin-divider)"
    >
      {ordenaveis.length > 0 ? (
        <NativeSelect.Root size="sm" flex="1" minW={0}>
          <NativeSelect.Field
            aria-label={t.ordenar}
            value={sort ? `${sort.key}:${sort.dir}` : ""}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return onSortChange(null);
              const idx = v.lastIndexOf(":");
              onSortChange({ key: v.slice(0, idx), dir: v.slice(idx + 1) as "asc" | "desc" });
            }}
            bg="var(--admin-surface)"
            color="var(--admin-text)"
            fontSize="sm"
          >
            <option value="">{t.ordemPadrao}</option>
            {ordenaveis.map((c) => (
              <optgroup key={c.key} label={c.rotulo}>
                <option value={`${c.key}:asc`}>{c.rotulo} ↑</option>
                <option value={`${c.key}:desc`}>{c.rotulo} ↓</option>
              </optgroup>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      ) : (
        <Box color="var(--admin-text-soft)" display="inline-flex">
          <ArrowDownUp size={14} />
        </Box>
      )}
      {filtraveis.length > 0 ? (
        <Button size="sm" tone="outline" onClick={() => setModalFiltro(true)}>
          <ListFilter size={14} />{" "}
          {ativos.length > 0 ? fmtTexto(t.filtrarContagem, { n: ativos.length }) : t.filtrar}
        </Button>
      ) : null}
    </HStack>
  ) : null;

  const acordeao = (
    <Accordion
      items={filtraveis.map((c) => {
        const ativo = filtros.find((f) => f.key === c.key)?.valores ?? null;
        return {
          value: c.key,
          title: c.rotulo,
          meta:
            ativo && ativo.length > 0 ? (
              <Text as="span" fontSize="xs" color="var(--admin-primary)" fontWeight={700}>
                {ativo.length}
              </Text>
            ) : undefined,
          content: (
            <FacetasLazy
              facetas={c.facetas}
              ativo={ativo && ativo.length > 0 ? ativo : null}
              onChange={(valores) => onFiltroChange(c.key, valores)}
              textos={t}
            />
          ),
        };
      })}
    />
  );

  return (
    <>
      {controlesMobile}
      {/* Só monta aberto: as facetas varrem as linhas inteiras (lazy de verdade). */}
      {modalFiltro && !filtrosEmSheet ? (
        <Box
          display={{ base: "block", md: "none" }}
          px={3}
          py={2}
          borderBottomWidth="1px"
          borderColor="var(--admin-divider)"
        >
          {acordeao}
        </Box>
      ) : null}
      {chips}
      {modalFiltro && filtrosEmSheet ? (
        <Modal open onClose={() => setModalFiltro(false)} title={t.filtrar} size="sm">
          {acordeao}
        </Modal>
      ) : null}
    </>
  );
}
