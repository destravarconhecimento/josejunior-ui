"use client";

import { ClientOnly, IconButton, Skeleton, type IconButtonProps } from "@chakra-ui/react";
import { ThemeProvider, useTheme, type ThemeProviderProps } from "next-themes";
import { createContext, useContext, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";

export type ColorMode = "light" | "dark";

/** `next-themes` na convenção do design-system (classe no `<html>`). */
export function ColorModeProvider(props: ThemeProviderProps) {
  return <ThemeProvider attribute="class" disableTransitionOnChange {...props} />;
}

export function useColorMode(): {
  colorMode: ColorMode | undefined;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
} {
  const { resolvedTheme, setTheme } = useTheme();
  return {
    colorMode: resolvedTheme as ColorMode | undefined,
    setColorMode: setTheme,
    toggleColorMode: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
  };
}

const SwitchableContext = createContext(false);

/**
 * Liga a troca de tema para os shells: o `UiProvider` publica `true` quando
 * roda com `forceMode={false}`, e é isso que faz o `ColorModeButton` aparecer
 * na topbar sem nenhuma tela precisar passar prop.
 */
export function ColorModeSwitchableProvider({
  value,
  children,
}: {
  value: boolean;
  children: ReactNode;
}) {
  return <SwitchableContext.Provider value={value}>{children}</SwitchableContext.Provider>;
}

export function useColorModeSwitchable(): boolean {
  return useContext(SwitchableContext);
}

export function ColorModeButton({
  onDark,
  ...rest
}: Omit<IconButtonProps, "aria-label"> & { onDark?: boolean }) {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <ClientOnly fallback={<Skeleton boxSize="8" />}>
      <IconButton
        onClick={toggleColorMode}
        variant="ghost"
        size="sm"
        aria-label={colorMode === "dark" ? "Tema claro" : "Tema escuro"}
        title={colorMode === "dark" ? "Tema claro" : "Tema escuro"}
        color={onDark ? "rgba(255,255,255,0.82)" : undefined}
        _hover={onDark ? { bg: "rgba(255,255,255,0.10)", color: "white" } : undefined}
        {...rest}
      >
        {colorMode === "dark" ? <Moon size={18} /> : <Sun size={18} />}
      </IconButton>
    </ClientOnly>
  );
}
