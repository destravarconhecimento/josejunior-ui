"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Box, chakra, Portal, Stack } from "@chakra-ui/react";
import { Button, type ButtonTone } from "./Button";

export type ActionMenuItem = {
  label: string;
  /**
   * O que a ação FAZ, em uma frase. NÃO vira segunda linha: vai pro `title`, que
   * é o balão do mouse e o que o leitor de tela anuncia. Já foi linha de baixo em
   * cinza — cada item ficava com o dobro da altura e um menu de onze ações não
   * cabia na tela. O rótulo curto ("Feito") resolve pra quem já sabe; quem hesita
   * para o mouse em cima e lê.
   */
  hint?: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  /** abre o href em nova guia */
  external?: boolean;
  danger?: boolean;
};

/** Respiro entre o gatilho e o menu, e do menu pra borda da janela. */
const ESPACO = 6;
const MARGEM = 8;
/** Abaixo disto não vale abrir pro lado escolhido: melhor virar pro outro. */
const ALTURA_MINIMA = 140;

type Lugar = { top: number; left: number; maxH: number };

/**
 * Botão que agrupa ações secundárias num dropdown (via Portal — não é cortado
 * pelo header). Usado quando o PageHeader tem muitos botões.
 *
 * Também serve de "…" numa LINHA de tabela: `label=""` + `icon` deixam o gatilho
 * só com o ícone, e aí o `ariaLabel` é obrigatório — botão sem nome acessível é
 * botão que o leitor de tela anuncia como "botão".
 *
 * A posição é MEDIDA, não chutada: o menu é montado invisível, o efeito de
 * layout lê o tamanho real dele e só então decide se abre pra baixo ou pra cima,
 * gruda dentro da janela nos dois eixos e corta a altura com rolagem própria.
 * Sem isso, um menu numa linha do rodapé da tabela abria metade fora da tela e a
 * última ação era inalcançável.
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
  /** Onde o gatilho estava quando abriu — a âncora da conta. */
  const [alvo, setAlvo] = useState<DOMRect | null>(null);
  /** Só existe depois da medição; até lá o menu fica montado e invisível. */
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const el = triggerRef.current;
    if (!el) return;
    setAlvo(el.getBoundingClientRect());
    setLugar(null);
    setOpen(true);
  }

  const medir = useCallback(() => {
    const m = menuRef.current;
    const a = triggerRef.current?.getBoundingClientRect();
    if (!m || !a) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Altura que o conteúdo QUER, não a que ele tem depois de cortado.
    const cheia = m.scrollHeight;
    const abaixo = vh - a.bottom - ESPACO - MARGEM;
    const acima = a.top - ESPACO - MARGEM;
    // Vira pra cima só se não couber embaixo E lá em cima couber mais.
    const paraCima = cheia > abaixo && acima > abaixo;
    const maxH = Math.max(ALTURA_MINIMA, paraCima ? acima : abaixo);
    const altura = Math.min(cheia, maxH);
    const top = paraCima
      ? Math.max(MARGEM, a.top - ESPACO - altura)
      : Math.min(a.bottom + ESPACO, Math.max(MARGEM, vh - MARGEM - altura));
    const largura = Math.min(m.offsetWidth, vw - MARGEM * 2);
    // Alinhado pela direita do gatilho (é o canto onde o "…" mora), mas grudado
    // dentro da janela: no fim, quem manda é a janela.
    const left = Math.min(Math.max(MARGEM, a.right - largura), Math.max(MARGEM, vw - MARGEM - largura));
    setLugar({ top, left, maxH });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    medir();
  }, [open, items.length, medir]);

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
    function onScroll(e: Event) {
      // Rolagem DENTRO do menu não fecha o menu: quando a lista é alta ela ganha
      // rolagem própria, e o ouvinte de captura enxergaria esse scroll também.
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onResize() {
      medir();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, medir]);

  const itemStyle = (danger?: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: 2.5,
    w: "100%",
    textAlign: "left" as const,
    px: 2.5,
    py: 1.5,
    borderRadius: "8px",
    fontSize: "sm",
    fontWeight: "500",
    lineHeight: "1.35",
    whiteSpace: "nowrap" as const,
    color: danger ? "#dc2626" : "var(--admin-text)",
    cursor: "pointer",
    _hover: { bg: danger ? "rgba(220,38,38,0.08)" : "var(--admin-nav-hover)" },
  });

  const balao = (it: ActionMenuItem) => (it.hint ? `${it.label} — ${it.hint}` : it.label);

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
      {open && alvo ? (
        <Portal>
          <Stack
            ref={menuRef}
            role="menu"
            gap={0.5}
            position="fixed"
            top={`${lugar ? lugar.top : alvo.bottom + ESPACO}px`}
            left={`${lugar ? lugar.left : Math.max(MARGEM, alvo.right - 200)}px`}
            /* Antes da medição o menu existe pra ser medido, não pra ser visto. */
            visibility={lugar ? "visible" : "hidden"}
            minW="200px"
            maxW={`calc(100vw - ${MARGEM * 2}px)`}
            maxH={lugar ? `${lugar.maxH}px` : undefined}
            overflowY="auto"
            overscrollBehavior="contain"
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
                  title={balao(it)}
                  {...(it.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  onClick={() => setOpen(false)}
                  {...itemStyle(it.danger)}
                >
                  {it.icon ? <Box as="span" display="inline-flex" color="var(--admin-text-soft)">{it.icon}</Box> : null}
                  <Box as="span" flex="1" minW={0} overflow="hidden" textOverflow="ellipsis">
                    {it.label}
                  </Box>
                </chakra.a>
              ) : (
                <chakra.button
                  key={i}
                  type="button"
                  title={balao(it)}
                  onClick={() => {
                    setOpen(false);
                    it.onClick?.();
                  }}
                  {...itemStyle(it.danger)}
                >
                  {it.icon ? <Box as="span" display="inline-flex" color="var(--admin-text-soft)">{it.icon}</Box> : null}
                  <Box as="span" flex="1" minW={0} overflow="hidden" textOverflow="ellipsis">
                    {it.label}
                  </Box>
                </chakra.button>
              ),
            )}
          </Stack>
        </Portal>
      ) : null}
    </>
  );
}
