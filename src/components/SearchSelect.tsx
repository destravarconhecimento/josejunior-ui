"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Portal, Stack } from "@chakra-ui/react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { FormField } from "./form";
import { Input } from "./controls";

export type SearchSelectOption = {
  value: string;
  label: string;
  /** Linha secundária esmaecida (ex.: grupo muscular / equipamento). */
  hint?: string;
  /** Texto extra pesquisável, NÃO exibido (ex.: sinônimos, instruções). */
  keywords?: string;
};

type Placement = { top: number; left: number; width: number; up: boolean };

/** Normaliza p/ busca: minúsculas + sem acento (casa "supino" com "Supíno"). */
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/**
 * Combobox com busca (type-ahead) — campo de formulário do design-system.
 *
 * Igual ao `FormSelect` por fora (label/erro/superfície `--admin`), mas em vez
 * do `<select>` nativo abre um popover via Portal (não é cortado pelo overflow
 * do Modal/tabela) com uma caixa de busca que filtra `options` por
 * `label` + `hint` + `keywords`. Pensado p/ listas grandes (ex.: 1000+
 * exercícios) onde o select nativo é impraticável. Navegação por teclado
 * (↑/↓/Enter/Esc). Modelado no `InlineSelect` (posicionamento/click-outside).
 */
export function SearchSelect({
  label,
  help,
  error,
  required,
  value,
  onChange,
  options,
  placeholder = "Selecione…",
  searchPlaceholder = "Buscar…",
  emptyLabel = "Nenhum resultado.",
  disabled,
  clearable,
  id,
  testId,
}: {
  label?: React.ReactNode;
  help?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: SearchSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  /** Mostra "x" para limpar (default: quando não é `required`). */
  clearable?: boolean;
  id?: string;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [place, setPlace] = useState<Placement | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLElement | null)[]>([]);
  // Quando dentro de um Modal/Drawer (Chakra Dialog), portamos o popover PARA
  // DENTRO do conteúdo do dialog (não pro <body>). Assim o dialog trata os
  // cliques como "dentro" — senão o focus-trap/interact-outside do Ark engole o
  // clique (fecha o modal / não deixa selecionar) e bloqueia a busca. Fora de
  // um dialog fica null → Portal cai no default (<body>).
  const portalRef = useRef<HTMLElement | null>(null);

  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);
  const showClear = (clearable ?? !required) && !disabled && Boolean(value);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return options;
    const terms = q.split(/\s+/);
    return options.filter((o) => {
      const hay = norm(`${o.label} ${o.hint ?? ""} ${o.keywords ?? ""}`);
      return terms.every((t) => hay.includes(t));
    });
  }, [options, query]);

  function position() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    const up = below < 340 && r.top > below;
    setPlace({ top: up ? r.top - 6 : r.bottom + 6, left: r.left, width: r.width, up });
  }

  function openMenu() {
    if (disabled) return;
    setQuery("");
    const idx = options.findIndex((o) => o.value === value);
    setActive(idx >= 0 ? idx : 0);
    // Alvo do Portal: o conteúdo do dialog que envolve o gatilho (se houver).
    portalRef.current = triggerRef.current?.closest<HTMLElement>('[role="dialog"],[role="alertdialog"]') ?? null;
    position();
    setOpen(true);
  }

  function commit(v: string) {
    setOpen(false);
    if (v !== value) onChange(v);
  }

  // Reseta o realce p/ o topo a cada nova filtragem.
  useEffect(() => {
    setActive(0);
  }, [query]);

  // Autofoca a busca ao abrir.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Mantém o item ativo visível ao navegar por teclado.
  useEffect(() => {
    if (open) optionRefs.current[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onMove() {
      position();
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[active];
      if (opt) commit(opt.value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <FormField label={label} help={help} error={error} required={required}>
      <Box
        ref={triggerRef}
        id={id}
        data-testid={testId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        tabIndex={disabled ? -1 : 0}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            openMenu();
          }
        }}
        display="flex"
        alignItems="center"
        gap={2}
        w="100%"
        minH="40px"
        px={3}
        cursor={disabled ? "not-allowed" : "pointer"}
        opacity={disabled ? 0.6 : 1}
        bg="var(--admin-surface)"
        borderWidth="1px"
        borderColor={open ? "var(--admin-primary)" : "var(--admin-border)"}
        borderRadius="md"
        boxShadow={open ? "0 0 0 1px var(--admin-primary)" : undefined}
        transition="border-color .12s ease, box-shadow .12s ease"
        fontSize="sm"
        _hover={{ borderColor: disabled ? "var(--admin-border)" : "var(--admin-primary)" }}
      >
        <Box flex="1" minW={0} lineClamp={1} color={selected ? "var(--admin-text)" : "var(--admin-text-soft)"}>
          {selected ? (
            <>
              {selected.label}
              {selected.hint ? (
                <Box as="span" color="var(--admin-text-soft)"> · {selected.hint}</Box>
              ) : null}
            </>
          ) : (
            placeholder
          )}
        </Box>
        {showClear ? (
          <Box
            as="span"
            role="button"
            aria-label="Limpar"
            display="inline-flex"
            alignItems="center"
            color="var(--admin-text-soft)"
            _hover={{ color: "var(--admin-text)" }}
            onClick={(e) => {
              e.stopPropagation();
              commit("");
            }}
          >
            <X size={15} />
          </Box>
        ) : null}
        <ChevronDown size={16} style={{ color: "var(--admin-text-soft)", flexShrink: 0 }} />
      </Box>

      {open && !disabled && place ? (
        <Portal container={portalRef}>
          <Stack
            ref={menuRef}
            gap={0}
            position="fixed"
            top={`${place.top}px`}
            left={`${place.left}px`}
            transform={place.up ? "translateY(-100%)" : undefined}
            w={`${Math.max(place.width, 280)}px`}
            zIndex={1500}
            bg="var(--admin-surface)"
            borderWidth="1px"
            borderColor="var(--admin-border)"
            borderRadius="12px"
            boxShadow="0 16px 40px rgba(15,23,42,0.18)"
            overflow="hidden"
          >
            <Box p={2} borderBottomWidth="1px" borderColor="var(--admin-border)">
              <Box position="relative">
                <Box
                  position="absolute"
                  left="10px"
                  top="50%"
                  transform="translateY(-50%)"
                  color="var(--admin-text-soft)"
                  pointerEvents="none"
                >
                  <Search size={15} />
                </Box>
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={searchPlaceholder}
                  size="sm"
                  pl="32px"
                />
              </Box>
            </Box>
            <Stack gap={0.5} p={1.5} maxH="320px" overflowY="auto">
              {filtered.length === 0 ? (
                <Box px={2.5} py={3} fontSize="sm" color="var(--admin-text-soft)" textAlign="center">
                  {emptyLabel}
                </Box>
              ) : (
                filtered.map((o, i) => {
                  const isSelected = o.value === value;
                  const isActive = i === active;
                  return (
                    <Box
                      as="button"
                      key={o.value}
                      ref={(el:any) => {
                        optionRefs.current[i] = el;
                      }}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => commit(o.value)}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      gap={3}
                      w="100%"
                      textAlign="left"
                      px={2.5}
                      py={2}
                      borderRadius="8px"
                      fontSize="sm"
                      color={isSelected ? "var(--admin-primary)" : "var(--admin-text)"}
                      bg={isSelected ? "var(--admin-nav-active)" : isActive ? "var(--admin-nav-hover)" : "transparent"}
                      transition="background .1s ease"
                    >
                      <Box minW={0}>
                        <Box lineClamp={1} fontWeight={isSelected ? "600" : "500"}>
                          {o.label}
                        </Box>
                        {o.hint ? (
                          <Box lineClamp={1} fontSize="xs" color="var(--admin-text-soft)">
                            {o.hint}
                          </Box>
                        ) : null}
                      </Box>
                      {isSelected ? <Check size={15} style={{ flexShrink: 0 }} /> : null}
                    </Box>
                  );
                })
              )}
            </Stack>
          </Stack>
        </Portal>
      ) : null}
    </FormField>
  );
}
