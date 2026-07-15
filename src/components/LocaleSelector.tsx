"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Box, chakra, Portal, Stack } from "@chakra-ui/react";
import { FlagIcon } from "./FlagIcon";

/** `flag` = código de país ISO (br/us/es…) — o FlagIcon desenha o SVG. */
export type LocaleOption = { code: string; label: string; short: string; flag?: string };

/**
 * Seletor de idioma do design-system. Autocontido e NEUTRO (não depende de
 * `--admin-*` nem `--al-*`) — o mesmo componente serve site público, portal e
 * painel. Recebe dados+callback por props (a action fica no app). Some quando só
 * há um idioma → tenant só-pt não vê seletor (zero mudança visual).
 *
 * A troca chama a server action (via onSelect) que revalida a árvore no servidor:
 * a página re-renderiza no novo idioma (SSR, sem flip no cliente).
 */
export function LocaleSelector({
  current,
  options,
  onSelect,
  size = "sm",
  align = "end",
  onDark = false,
  compact = false,
}: {
  current: string;
  options: LocaleOption[];
  onSelect: (code: string) => void | Promise<void>;
  size?: "xs" | "sm" | "md";
  align?: "start" | "end";
  /** Sobre fundo escuro/colorido (topbar de marca, sidebar): vira botão fantasma
   *  claro, no mesmo esquema do sino e do avatar (sem pílula branca). */
  onDark?: boolean;
  /** Só bandeira + seta, sem a sigla — pra topbar, onde o espaço é curto. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<{ top: number; left: number; right: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const cur = options.find((o) => o.code === current) ?? options[0];

  function position() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPlace({ top: r.bottom + 6, left: r.left, right: r.right });
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

  if (!options || options.length <= 1) return null;

  const pad = size === "xs" ? { px: 2, py: 1 } : size === "md" ? { px: 3, py: 2 } : { px: 2.5, py: 1.5 };
  const fs = size === "xs" ? "12px" : "13px";

  function choose(code: string) {
    setOpen(false);
    if (code === current) return;
    startTransition(() => {
      void onSelect(code);
    });
  }

  return (
    <>
      <Box ref={triggerRef} display="inline-flex">
        <chakra.button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Idioma"
          disabled={pending}
          display="inline-flex"
          alignItems="center"
          gap={1.5}
          {...(compact ? { px: 2, py: 1.5 } : pad)}
          fontSize={fs}
          fontWeight="600"
          lineHeight="1"
          borderRadius={onDark ? "10px" : "9px"}
          borderWidth={onDark ? "0px" : "1px"}
          borderColor={onDark ? "transparent" : "rgba(0,0,0,0.12)"}
          bg={onDark ? "transparent" : "rgba(255,255,255,0.85)"}
          color={onDark ? "white" : "#1f2937"}
          cursor="pointer"
          opacity={pending ? 0.6 : 1}
          transition="background 140ms ease"
          _hover={onDark ? { bg: "rgba(255,255,255,0.15)" } : { bg: "#fff", borderColor: "rgba(0,0,0,0.22)" }}
        >
          {cur?.flag ? <FlagIcon code={cur.flag} size={18} /> : <GlobeIcon />}
          {!compact ? <Box as="span">{cur?.short ?? current.toUpperCase()}</Box> : null}
          <Caret />
        </chakra.button>
      </Box>
      {open && place ? (
        <Portal>
          <Stack
            ref={menuRef}
            role="menu"
            gap={0.5}
            position="fixed"
            top={`${place.top}px`}
            left={align === "end" ? undefined : `${place.left}px`}
            right={align === "end" ? `${Math.max(8, window.innerWidth - place.right)}px` : undefined}
            minW="180px"
            zIndex={1600}
            p={1.5}
            bg="#fff"
            borderWidth="1px"
            borderColor="rgba(0,0,0,0.10)"
            borderRadius="12px"
            boxShadow="0 16px 40px rgba(15,23,42,0.18)"
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((o) => {
              const active = o.code === current;
              return (
                <chakra.button
                  key={o.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => choose(o.code)}
                  display="flex"
                  alignItems="center"
                  gap={2.5}
                  w="100%"
                  textAlign="left"
                  px={2.5}
                  py={2}
                  borderRadius="8px"
                  fontSize="sm"
                  fontWeight={active ? "700" : "500"}
                  color="#1f2937"
                  cursor="pointer"
                  bg={active ? "rgba(0,0,0,0.05)" : "transparent"}
                  _hover={{ bg: "rgba(0,0,0,0.06)" }}
                >
                  {o.flag ? (
                    <FlagIcon code={o.flag} size={20} />
                  ) : (
                    <Box as="span" w="20px" display="inline-flex" justifyContent="center" color="#6b7280" fontWeight="700" fontSize="11px">
                      {o.short}
                    </Box>
                  )}
                  <Box as="span" flex="1">{o.label}</Box>
                  {active ? <CheckIcon /> : null}
                </chakra.button>
              );
            })}
          </Stack>
        </Portal>
      ) : null}
    </>
  );
}

/* Ícones inline (sem dependência de lucide → seguro em qualquer surface/RSC). */
function GlobeIcon() {
  return (
    <chakra.svg width="14px" height="14px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </chakra.svg>
  );
}
function Caret() {
  return (
    <chakra.svg width="11px" height="11px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" opacity={0.6} aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </chakra.svg>
  );
}
function CheckIcon() {
  return (
    <chakra.svg width="14px" height="14px" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </chakra.svg>
  );
}
