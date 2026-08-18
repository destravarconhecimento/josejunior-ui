"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box, chakra, Portal, Stack } from "@chakra-ui/react";
import { Button, type ButtonTone } from "./Button";

export type ActionMenuItem = {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  /** abre o href em nova guia */
  external?: boolean;
  danger?: boolean;
};

/**
 * Botão que agrupa ações secundárias num dropdown (via Portal — não é cortado
 * pelo header). Usado quando o PageHeader tem muitos botões.
 *
 * Também serve de "…" numa LINHA de tabela: `label=""` + `icon` deixam o gatilho
 * só com o ícone, e aí o `ariaLabel` é obrigatório — botão sem nome acessível é
 * botão que o leitor de tela anuncia como "botão".
 */
export function ActionMenu({
  label = "Mais",
  icon,
  items,
  size = "sm",
  tone = "outline",
  ariaLabel,
}: {
  label?: string;
  icon?: ReactNode;
  items: ActionMenuItem[];
  size?: "xs" | "sm" | "md";
  tone?: ButtonTone;
  /** Nome do gatilho quando ele é só ícone (vira `aria-label` e `title`). */
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function position() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPlace({ top: r.bottom + 6, left: r.right });
  }
  function toggle() {
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
    function onMove() {
      setOpen(false);
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

  const itemStyle = (danger?: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: 2.5,
    w: "100%",
    textAlign: "left" as const,
    px: 2.5,
    py: 2,
    borderRadius: "8px",
    fontSize: "sm",
    fontWeight: "500",
    color: danger ? "#dc2626" : "var(--admin-text)",
    cursor: "pointer",
    _hover: { bg: danger ? "rgba(220,38,38,0.08)" : "var(--admin-nav-hover)" },
  });

  return (
    <>
      <Box ref={triggerRef} display="inline-flex">
        <Button
          tone={tone}
          size={size}
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={ariaLabel}
          title={ariaLabel}
        >
          {icon ? <Box as="span" display="inline-flex" mr={label ? 1.5 : 0}>{icon}</Box> : null}
          {label}
        </Button>
      </Box>
      {open && place ? (
        <Portal>
          <Stack
            ref={menuRef}
            role="menu"
            gap={0.5}
            position="fixed"
            top={`${place.top}px`}
            left={`${place.left}px`}
            transform="translateX(-100%)"
            minW="220px"
            zIndex={1500}
            p={1.5}
            bg="var(--admin-surface)"
            borderWidth="1px"
            borderColor="var(--admin-border)"
            borderRadius="12px"
            boxShadow="0 16px 40px rgba(15,23,42,0.18)"
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((it, i) =>
              it.href ? (
                <chakra.a
                  key={i}
                  href={it.href}
                  {...(it.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  onClick={() => setOpen(false)}
                  {...itemStyle(it.danger)}
                >
                  {it.icon ? <Box as="span" display="inline-flex" color="var(--admin-text-soft)">{it.icon}</Box> : null}
                  <Box as="span" flex="1">{it.label}</Box>
                </chakra.a>
              ) : (
                <chakra.button
                  key={i}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    it.onClick?.();
                  }}
                  {...itemStyle(it.danger)}
                >
                  {it.icon ? <Box as="span" display="inline-flex" color="var(--admin-text-soft)">{it.icon}</Box> : null}
                  <Box as="span" flex="1">{it.label}</Box>
                </chakra.button>
              ),
            )}
          </Stack>
        </Portal>
      ) : null}
    </>
  );
}
