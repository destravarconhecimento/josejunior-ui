"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import { useMemo, type ReactNode } from "react";
import { getUiSystem, type UiSystem } from "./system";
import { ColorModeSwitchableProvider } from "./color-mode";

/**
 * Provider único de UI do design-system: faz a fiação `next-themes` + Chakra
 * uma única vez, pra os apps não importarem `@chakra-ui/react` direto.
 * A COR vem do chamador via `system` (criado com `createUiSystem`).
 *
 * O `system` é resolvido no RENDER (useMemo), nunca no topo do módulo — assim o
 * `createSystem` não roda durante o "collect page data" do build (onde o bundle
 * do Chakra transpilado tem a anatomy quebrada).
 *
 * - `mode`: "light" | "dark" (padrão light).
 * - `forceMode`: trava o tema (forcedTheme) vs só o default (defaultTheme).
 *   Com `forceMode={false}` a troca de tema fica LIGADA e os shells passam a
 *   mostrar o `ColorModeButton` (via contexto, sem prop nas telas).
 */
export function UiProvider({
  children,
  system,
  mode = "light",
  forceMode = true,
}: {
  children: ReactNode;
  system?: UiSystem;
  mode?: "light" | "dark";
  forceMode?: boolean;
}) {
  const sys = useMemo(() => system ?? getUiSystem(), [system]);
  return (
    <ThemeProvider
      attribute="class"
      enableSystem={false}
      {...(forceMode ? { forcedTheme: mode } : { defaultTheme: mode })}
      disableTransitionOnChange
    >
      <ChakraProvider value={sys}>
        <ColorModeSwitchableProvider value={!forceMode}>{children}</ColorModeSwitchableProvider>
      </ChakraProvider>
    </ThemeProvider>
  );
}
