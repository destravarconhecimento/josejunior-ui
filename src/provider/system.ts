"use client";

// ⚠️ Este "use client" é ESTRUTURAL, não cosmético — não tire.
//
// `defaultConfig` arrasta TODAS as receitas do Chakra, e a receita do accordion
// lê `anatomy.js`, que importa `@ark-ui/react/accordion` — um módulo marcado
// "use client" pelo próprio ark. Quando um SERVER component importa o barrel do
// `@josejunior/ui`, o index re-exporta este módulo, o grafo do servidor avalia
// esta linha e o React entrega o ark como *client reference* (um proxy, não a
// anatomy). Aí o `accordionAnatomy.extendWith("itemBody")` que o Chakra roda no
// topo do `anatomy.js` estoura: "extendWith is not a function".
//
// Era o que derrubava a home (`TemplateV1` é server component e o registry o
// importa SEMPRE, mesmo pra tenant v4) enquanto a /recarga vivia — o
// `TemplateV4` é "use client" e o barrel dele já caía no grafo do cliente.
//
// A regra "createSystem tem que ser LAZY" (CLAUDE.md) só adiava a CHAMADA; o
// IMPORT continuava avaliando o barrel no servidor. Marcando o módulo como
// client, a fronteira para o grafo do servidor aqui e a regra passa a ser
// garantida pelo bundler em vez de confiada a cada call site. Ninguém chama o
// system no servidor: os `makeSystem` dos apps só rodam no render do Provider.
import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import { PAINEL_CONFIG } from "../theme/painel-config";

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

/**
 * System do PAINEL — `defaultConfig` + base compartilhada (`PAINEL_CONFIG`) +
 * a config do app encadeada por último (a marca do app ganha). LAZY: é função.
 * A landing (`apps/web`) NÃO usa esta base — segue em `createUiSystem`.
 */
export function createPainelSystem(config?: Parameters<typeof defineConfig>[0]): UiSystem {
  return createSystem(defaultConfig, PAINEL_CONFIG, defineConfig(config ?? {}));
}

export { PAINEL_CONFIG };
