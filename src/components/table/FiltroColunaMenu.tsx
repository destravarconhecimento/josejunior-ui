"use client";

import { useMemo, useState } from "react";
import { Box, Checkbox, HStack, Input, Popover, Portal, Stack, Text } from "@chakra-ui/react";
import { Filter } from "lucide-react";
import { norm } from "../../search";
import { useUiTextos } from "../../provider/textos";
import { fmtTexto, type UiTextos } from "../../textos";
import type { ValorFaceta } from "./filtros";

/**
 * Lista de valores da coluna com busca + checkboxes (estilo Excel). Compartilhada
 * pelo popover do cabeçalho (desktop) e pelo modal "Filtrar" (mobile).
 *
 * Semântica: `ativo == null` = SEM filtro (todo mundo marcado). Desmarcar um
 * valor cria o filtro "todos menos esse"; desmarcar o último (ou marcar todos
 * de volta) devolve `null` — o filtro se desfaz sozinho.
 */
export function ListaFacetas({
  facetas,
  ativo,
  onChange,
  textos,
}: {
  /** Facetas JÁ computadas (quem monta decide a hora — sempre lazy). */
  facetas: ValorFaceta[];
  /** Chaves marcadas; `null` = sem filtro nesta coluna. */
  ativo: string[] | null;
  onChange: (valores: string[] | null) => void;
  /** Strings já resolvidas pela DataTable; sem elas vem do contexto/pt-BR. */
  textos?: UiTextos;
}) {
  const t = useUiTextos(textos);
  const [busca, setBusca] = useState("");
  const visiveis = useMemo(() => {
    const q = norm(busca.trim());
    if (!q) return facetas;
    return facetas.filter((f) => norm(f.rotulo).includes(q));
  }, [facetas, busca]);

  const total = facetas.reduce((s, f) => s + f.n, 0);
  const marcado = (chave: string) => ativo == null || ativo.includes(chave);

  const alternar = (chave: string, on: boolean) => {
    const todas = facetas.map((f) => f.chave);
    const atual = ativo == null ? todas : ativo;
    const nova = on ? [...atual.filter((v) => v !== chave), chave] : atual.filter((v) => v !== chave);
    // Cobriu todos os valores (ou zerou): filtro não corta nada — desfaz.
    if (nova.length === 0 || todas.every((c) => nova.includes(c))) onChange(null);
    else onChange(nova);
  };

  const linha = (props: {
    key?: string;
    checked: boolean | "indeterminate";
    onCheck: (on: boolean) => void;
    rotulo: string;
    n?: number;
    forte?: boolean;
  }) => (
    <Checkbox.Root
      key={props.key}
      size="sm"
      checked={props.checked}
      onCheckedChange={(e) => props.onCheck(e.checked === true)}
      display="flex"
      alignItems="center"
      gap={2}
      w="full"
      px={2}
      py={1}
      borderRadius="8px"
      cursor="pointer"
      _hover={{ bg: "var(--admin-nav-hover)" }}
    >
      <Checkbox.HiddenInput />
      {/* Cores EXPLÍCITAS dos tokens --admin-*: o popover vive num Portal, fora
          do shell do painel — no rep ele herdaria o tema dark do site público
          (texto claro sobre o fundo branco do .admin-dropdown, ilegível). */}
      <Checkbox.Control
        borderColor="var(--admin-border)"
        bg="var(--admin-surface)"
        color="#ffffff"
        _checked={{ bg: "var(--admin-primary)", borderColor: "var(--admin-primary)" }}
        _indeterminate={{ bg: "var(--admin-primary)", borderColor: "var(--admin-primary)" }}
      />
      <Checkbox.Label flex="1" minW={0}>
        <HStack gap={2} justify="space-between" w="full">
          <Text fontSize="sm" fontWeight={props.forte ? 600 : 400} lineClamp={1} color="var(--admin-text)">
            {props.rotulo}
          </Text>
          {props.n != null ? (
            <Text fontSize="xs" color="var(--admin-text-soft)" flexShrink={0}>
              {props.n}
            </Text>
          ) : null}
        </HStack>
      </Checkbox.Label>
    </Checkbox.Root>
  );

  return (
    <Stack gap={1.5}>
      {facetas.length > 7 ? (
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder={t.buscarValor}
          size="sm"
          bg="var(--admin-surface)"
          color="var(--admin-text)"
          borderColor="var(--admin-border)"
          _placeholder={{ color: "var(--admin-text-soft)" }}
        />
      ) : null}
      {linha({
        checked: ativo == null ? true : "indeterminate",
        onCheck: () => onChange(null),
        rotulo: t.selecionarTudo,
        n: total,
        forte: true,
      })}
      <Box h="1px" bg="var(--admin-divider)" />
      {/* Scroll SÓ aqui dentro (popover/modal em Portal) — nunca em volta da tabela. */}
      <Stack gap={0} maxH="260px" overflowY="auto">
        {visiveis.map((f) =>
          linha({
            key: f.chave,
            checked: marcado(f.chave),
            onCheck: (on) => alternar(f.chave, on),
            rotulo: f.rotulo,
            n: f.n,
          }),
        )}
        {visiveis.length === 0 ? (
          <Text fontSize="sm" color="var(--admin-text-soft)" px={2} py={2}>
            {fmtTexto(t.nenhumValorCom, { busca })}
          </Text>
        ) : null}
      </Stack>
    </Stack>
  );
}

/**
 * Botão-funil do cabeçalho da coluna (desktop): abre popover com a ListaFacetas.
 * Facetas são computadas SÓ ao abrir (`lazyMount`/`unmountOnExit` + o callback
 * roda no mount do conteúdo) — o cálculo varre as linhas inteiras.
 */
export function FiltroColunaMenu({
  rotulo,
  ativo,
  facetas,
  onChange,
  textos,
}: {
  rotulo: string;
  ativo: string[] | null;
  /** Callback (não lista): computado só quando o popover abre. */
  facetas: () => ValorFaceta[];
  onChange: (valores: string[] | null) => void;
  /** Strings já resolvidas pela DataTable; sem elas vem do contexto/pt-BR. */
  textos?: UiTextos;
}) {
  const t = useUiTextos(textos);
  const [open, setOpen] = useState(false);
  const temFiltro = ativo != null && ativo.length > 0;

  return (
    <Popover.Root
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      positioning={{ placement: "bottom-start" }}
      lazyMount
      unmountOnExit
    >
      <Popover.Trigger asChild>
        <Box
          as="button"
          aria-label={fmtTexto(t.filtrarColuna, { coluna: rotulo })}
          title={fmtTexto(t.filtrarColuna, { coluna: rotulo })}
          // O th em volta é o botão de ordenar — o clique aqui não pode subir.
          onClick={(e) => e.stopPropagation()}
          p="3px"
          borderRadius="6px"
          flexShrink={0}
          color={temFiltro ? "var(--admin-primary)" : "var(--admin-text)"}
          opacity={temFiltro || open ? 1 : 0.7}
          _hover={{ opacity: 1, bg: "var(--admin-nav-hover)" }}
        >
          <Filter size={12} fill={temFiltro ? "currentColor" : "none"} />
        </Box>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content
            className="admin-dropdown"
            w="248px"
            p={2}
            borderRadius="12px"
            bg="var(--admin-surface)"
            color="var(--admin-text)"
          >
            <Text fontSize="xs" fontWeight={600} textTransform="uppercase" letterSpacing="0.04em" color="var(--admin-text-soft)" px={2} pb={1.5}>
              {rotulo}
            </Text>
            <FacetasLazy facetas={facetas} ativo={ativo} onChange={onChange} textos={t} />
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}

/** Computa as facetas UMA vez, no mount (que só acontece com o popover aberto). */
export function FacetasLazy({
  facetas,
  ativo,
  onChange,
  textos,
}: {
  facetas: () => ValorFaceta[];
  ativo: string[] | null;
  onChange: (valores: string[] | null) => void;
  textos?: UiTextos;
}) {
  const [lista] = useState(() => facetas());
  return <ListaFacetas facetas={lista} ativo={ativo} onChange={onChange} textos={textos} />;
}
