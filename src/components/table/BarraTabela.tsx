"use client";

import { useRef, useState, type FocusEvent, type ReactNode } from "react";
import { Box, HStack, NativeSelect, Stack, Text } from "@chakra-ui/react";
import { ArrowDownUp, ListFilter, Search, X } from "lucide-react";
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
 * A busca que vira botão quando a linha da toolbar está cheia (título + filtros
 * + ações): fechada é só a lupa; o clique abre o campo — que fica MONTADO o
 * tempo todo, então o texto digitado sobrevive ao fechar — e foca; perder o
 * foco com o campo VAZIO fecha de novo. Com texto ela não fecha: fechada
 * implica vazia, e por isso a lupa não precisa de bolinha de "tem filtro".
 */
export function BuscaRecolhivel({
  busca,
  rotulo,
  largura = "14rem",
}: {
  busca: ReactNode;
  rotulo: string;
  largura?: string;
}) {
  const [aberta, setAberta] = useState(false);
  const caixaRef = useRef<HTMLDivElement | null>(null);
  const vazia = () => {
    const input = caixaRef.current?.querySelector("input");
    return !input || input.value.trim() === "";
  };
  const abrir = () => {
    setAberta(true);
    requestAnimationFrame(() => caixaRef.current?.querySelector("input")?.focus());
  };
  const aoSairFoco = (e: FocusEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    if (vazia()) setAberta(false);
  };
  return (
    <HStack gap={0} flexShrink={0} minW={0}>
      {!aberta ? (
        <Button size="sm" tone="ghost" aria-label={rotulo} title={rotulo} onClick={abrir}>
          <Search size={16} />
        </Button>
      ) : null}
      <Box
        ref={caixaRef}
        onBlur={aoSairFoco}
        onKeyDown={(e) => {
          if (e.key === "Escape" && vazia()) setAberta(false);
        }}
        w={aberta ? largura : "0"}
        overflow="hidden"
        transition="width .18s ease"
        style={{ visibility: aberta ? "visible" : "hidden" }}
        aria-hidden={!aberta}
      >
        {busca}
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
  busca,
  filtrosDaTela,
  filtrosDaTelaAtivos = 0,
  podeLimparDaTela = false,
  acoes,
  titulo,
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
  busca?: ReactNode;
  filtrosDaTela?: ReactNode;
  filtrosDaTelaAtivos?: number;
  /** `onLimparTudo` também zera a busca e os filtros da tela — então eles contam
   *  para o botão aparecer. */
  podeLimparDaTela?: boolean;
  /** Botão "Ações" da tabela, já montado — fica no fim da linha de controles. */
  acoes?: ReactNode;
  /**
   * Título da tabela NA LINHA de controles do mobile: ele ocupa a esquerda, a
   * busca vira lupa e, tocada, expande sobre o título até fechar. Sem título,
   * a linha continua a de sempre (campo de busca aberto à esquerda).
   */
  titulo?: string;
}) {
  const t = useUiTextos(textos);
  const [modalFiltro, setModalFiltro] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const caixaBuscaRef = useRef<HTMLDivElement | null>(null);
  const buscaVazia = () => {
    const input = caixaBuscaRef.current?.querySelector("input");
    return !input || input.value.trim() === "";
  };
  const abrirBusca = () => {
    setBuscaAberta(true);
    requestAnimationFrame(() => caixaBuscaRef.current?.querySelector("input")?.focus());
  };

  const ativos = filtros.filter((f) => f.valores.length > 0);
  const unificado = busca != null || filtrosDaTela != null || acoes != null;
  const temControles = ordenaveis.length > 0 || filtraveis.length > 0 || unificado;
  const limpaveis = ativos.length + (sort ? 1 : 0) + (podeLimparDaTela ? filtrosDaTelaAtivos : 0);
  const mostrarLimpar = limpaveis >= 2;
  const temChips = ativos.length > 0 || sort != null || chipsExtras != null || mostrarLimpar;
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
      {mostrarLimpar ? (
        <Button size="xs" tone="ghost" onClick={onLimparTudo}>
          {t.limparTudo}
        </Button>
      ) : null}
    </HStack>
  ) : null;

  const selectOrdenar =
    ordenaveis.length > 0 ? (
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
    ) : null;

  const qtdFiltros = ativos.length + filtrosDaTelaAtivos;
  const temPainel = filtrosDaTela != null || ordenaveis.length > 0 || filtraveis.length > 0;

  const controlesMobile = unificado ? (
    <HStack
      display={{ base: "flex", md: "none" }}
      px={3}
      py={2}
      gap={2}
      borderBottomWidth="1px"
      borderColor="var(--admin-divider)"
    >
      {titulo && busca != null && buscaAberta ? (
        <>
          <Box
            ref={caixaBuscaRef}
            flex="1"
            minW={0}
            onBlur={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
              if (buscaVazia()) setBuscaAberta(false);
            }}
          >
            {busca}
          </Box>
          <Button size="md" tone="ghost" flexShrink={0} aria-label={t.fechar} onClick={() => setBuscaAberta(false)}>
            <X size={16} />
          </Button>
        </>
      ) : (
        <>
          {titulo ? (
            <Text flex="1" minW={0} fontSize="sm" fontWeight={700} lineClamp={1} color="var(--admin-primary)">
              {titulo}
            </Text>
          ) : (
            <Box flex="1" minW={0}>
              {busca}
            </Box>
          )}
          {titulo && busca != null ? (
            <Button size="md" tone="outline" flexShrink={0} aria-label={t.buscar} title={t.buscar} onClick={abrirBusca}>
              <Search size={16} />
            </Button>
          ) : null}
          {temPainel ? (
            <Button size="md" tone="outline" flexShrink={0} onClick={() => setModalFiltro((v) => !v)}>
              <ListFilter size={16} />{" "}
              {qtdFiltros > 0 ? fmtTexto(t.filtrarContagem, { n: qtdFiltros }) : t.filtrar}
            </Button>
          ) : null}
          {acoes}
        </>
      )}
    </HStack>
  ) : temControles ? (
    <HStack
      display={{ base: "flex", md: "none" }}
      px={3}
      py={2}
      gap={2}
      borderBottomWidth="1px"
      borderColor="var(--admin-divider)"
    >
      {selectOrdenar ?? (
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

  const conteudo = unificado ? (
    <Stack gap={4}>
      {filtrosDaTela != null ? (
        <Stack gap={2} css={{ "& > *": { width: "100%", maxWidth: "100%" } }}>
          {filtrosDaTela}
        </Stack>
      ) : null}
      {selectOrdenar ? (
        <Box>
          <Text fontSize="xs" color="var(--admin-text-soft)" mb={1.5}>
            {t.ordenar}
          </Text>
          <HStack>{selectOrdenar}</HStack>
        </Box>
      ) : null}
      {filtraveis.length > 0 ? acordeao : null}
    </Stack>
  ) : (
    acordeao
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
          {conteudo}
        </Box>
      ) : null}
      {chips}
      {modalFiltro && filtrosEmSheet ? (
        <Modal open onClose={() => setModalFiltro(false)} title={t.filtrar} size="sm">
          {conteudo}
        </Modal>
      ) : null}
    </>
  );
}
