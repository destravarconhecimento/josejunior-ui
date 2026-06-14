"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box, Portal, Stack } from "@chakra-ui/react";
import { Check } from "lucide-react";

export type InlineSelectOption = { value: string; label: string; icon?: ReactNode };

type Placement = { top: number; left: number; width: number; up: boolean };

/**
 * Edição rápida em célula de tabela: mostra um gatilho (ex.: StatusBadge) e, ao
 * clicar, abre um dropdown estilizado (via Portal — não é cortado pelo overflow
 * da tabela) para trocar o valor, sem abrir o drawer. `render` desenha o gatilho
 * a partir do valor atual.
 */
export function InlineSelect({
  value,
  options,
  onChange,
  render,
  disabled,
}: {
  value: string | null;
  options: InlineSelectOption[];
  onChange: (value: string) => void;
  render: (value: string | null) => ReactNode;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<Placement | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function position() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    // Abre pra cima se não couber embaixo e houver mais espaço acima.
    const up = below < 340 && r.top > below;
    setPlace({
      top: up ? r.top - 6 : r.bottom + 6,
      left: r.left,
      width: r.width,
      up,
    });
  }

  function toggle() {
    if (disabled) return;
    if (!open) position();
    setOpen((o) => !o);
  }

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    // Em scroll/resize REPOSICIONA (não fecha) — senão o foco no clique scrolla a
    // célula dentro da tabela e fecha o menu na hora.
    function onMove() {
      position();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  return (
    <>
      <Box
        ref={triggerRef}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        display="inline-flex"
        cursor={disabled ? "default" : "pointer"}
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            if (!open) position();
            setOpen(true);
          }
        }}
      >
        {render(value)}
      </Box>
      {open && !disabled && place ? (
        <Portal>
          <Stack
            ref={menuRef}
            role="listbox"
            gap={0.5}
            position="fixed"
            top={`${place.top}px`}
            left={`${place.left}px`}
            transform={place.up ? "translateY(-100%)" : undefined}
            minW={`${Math.max(place.width, 184)}px`}
            maxH="400px"
            overflowY="auto"
            zIndex={1500}
            p={1.5}
            bg="var(--admin-surface)"
            borderWidth="1px"
            borderColor="var(--admin-border)"
            borderRadius="12px"
            boxShadow="0 16px 40px rgba(15,23,42,0.18)"
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((o) => {
              const selected = o.value === value;
              return (
                <Box
                  as="button"
                  key={o.value}
                  role="option"
                  aria-selected={selected}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    if (o.value !== value) onChange(o.value);
                  }}
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
                  fontWeight={selected ? "600" : "500"}
                  color={selected ? "var(--admin-primary)" : "var(--admin-text)"}
                  bg={selected ? "var(--admin-nav-active)" : "transparent"}
                  transition="background .12s ease"
                  _hover={{ bg: selected ? "var(--admin-nav-active)" : "var(--admin-nav-hover)" }}
                >
                  <Box as="span" display="inline-flex" alignItems="center" gap={2} minW={0}>
                    {o.icon ?? null}
                    <Box as="span" lineClamp={1}>{o.label}</Box>
                  </Box>
                  {selected ? <Check size={15} style={{ flexShrink: 0 }} /> : null}
                </Box>
              );
            })}
          </Stack>
        </Portal>
      ) : null}
    </>
  );
}
