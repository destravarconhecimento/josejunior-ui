import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

/**
 * Fábrica do `system` do Chakra para os apps — assim `createSystem`/`defineConfig`
 * (APIs do Chakra) ficam DENTRO do core e os apps passam só a COR como dado
 * (`createUiSystem({ theme: { tokens: { colors, fonts } } })`), sem importar
 * `@chakra-ui/react`. Coerente com "core sem cor; a cor vem de quem chama".
 */
export type UiSystem = ReturnType<typeof createSystem>;

export function createUiSystem(config: Parameters<typeof defineConfig>[0]): UiSystem {
  return createSystem(defaultConfig, defineConfig(config));
}

/**
 * System base neutro (sem cor de marca) — LAZY. Criar no topo do módulo roda o
 * `createSystem(defaultConfig)` durante o "collect page data" do build, quando o
 * bundle do Chakra (via pacote transpilado) tem a anatomy quebrada. Adiando para
 * o 1º uso (render), a fase de build não dispara.
 */
let _uiSystem: UiSystem | undefined;
export function getUiSystem(): UiSystem {
  return (_uiSystem ??= createUiSystem({
    theme: {
      tokens: {
        fonts: {
          heading: {
            value:
              "var(--font-heading, var(--admin-font-heading, ui-sans-serif)), system-ui, sans-serif",
          },
          body: {
            value:
              "var(--font-body, var(--admin-font-body, ui-sans-serif)), system-ui, sans-serif",
          },
        },
      },
    },
  }));
}
