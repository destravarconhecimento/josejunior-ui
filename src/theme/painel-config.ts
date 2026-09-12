import { defineConfig } from "@chakra-ui/react";

/**
 * DESIGN-SYSTEM DO PAINEL — base compartilhada (josejunior + 8899br).
 *
 * Uma rampa neutra só (`graphite`), borda translúcida no lugar de sombra, e
 * TODO par de cor declarado como `_light`/`_dark` — é isso que dá o modo claro
 * coerente e a troca de tema de graça.
 *
 * A LANDING (`apps/web`, Nocturne) NÃO usa esta base: ela tem design-system
 * próprio em CSS vars e vive forçada em escuro. Base de painel entra por
 * `createPainelSystem`; a landing segue em `createUiSystem` cru.
 *
 * ACESSIBILIDADE — por que `solid` não é o `500` em brand e critical. Medido:
 *
 *   #7567f8 + branco       = 4.16   REPROVA
 *   #d9463e + branco       = 4.29   REPROVA
 *   #a3e635 + branco       = 1.51   REPROVA de longe
 *
 * O `500` é o valor de marca e serve pro que é FORMA (barra de item ativo,
 * borda, ponto de estado) — ali a régua é 3:1 de componente, que ele passa.
 * Quem carrega TEXTO é o `solid`, escurecido o mínimo pra cruzar 4.5:
 * `brand.solid` #7062ed (4.51) e `critical.solid` #d3443c (4.50). A lima não
 * tem versão que passe com texto branco, então `positive.contrast` é GRAFITE.
 */

/**
 * ⚠️ Sobrescrita de token semântico do Chakra usa `_light`, NUNCA `base`.
 * O default do Chakra declara estes tokens como `{ _light, _dark }` e o merge é
 * por chave DENTRO do value: escrever `{ base, _dark }` deixa o `_light` de
 * fábrica vivo, e `_light` é seletor de classe, que ganha de `base` na cascata.
 * O escuro obedece e o CLARO fica com o cinza de fábrica — falha silenciosa.
 *
 * ⚠️ `{colors.hairline}` vai SEM `.DEFAULT`. A chave `DEFAULT` não faz parte do
 * caminho no Chakra v3: `{colors.hairline.DEFAULT}` gera referência que não
 * resolve, sai no CSS como literal e o navegador cai em `currentColor` — o
 * painel inteiro em contorno preto no claro.
 */
export const PAINEL_CONFIG = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#f1effe" },
          100: { value: "#e4e0fd" },
          200: { value: "#cbc4fb" },
          300: { value: "#aba0f9" },
          400: { value: "#8a7dfa" },
          500: { value: "#7567f8" },
          600: { value: "#5b4ae8" },
          700: { value: "#4838c4" },
          800: { value: "#392d9b" },
          900: { value: "#2f267c" },
          950: { value: "#1c1650" },
          alpha16: { value: "rgba(117, 103, 248, 0.16)" },
          alpha10: { value: "rgba(117, 103, 248, 0.10)" },
        },
        /**
         * A única rampa neutra: papel do claro (50/100), cinzas de texto
         * (400–600) e todas as superfícies escuras (750–950). Duas rampas
         * neutras que precisam casar entre si apodrecem — mexe numa, esquece a
         * outra, e o cinza do card deixa de casar com o do input.
         */
        graphite: {
          50: { value: "#f7f8fa" },
          100: { value: "#f1f2f5" },
          200: { value: "#e2e5ea" },
          300: { value: "#c7ccd4" },
          400: { value: "#98a0ac" },
          500: { value: "#6b7482" },
          600: { value: "#4c5563" },
          700: { value: "#333b47" },
          750: { value: "#1c2430" },
          800: { value: "#151b23" },
          900: { value: "#0b0f14" },
          950: { value: "#070a0e" },
        },
        positive: {
          50: { value: "#f3fce3" },
          100: { value: "#e6f9c6" },
          200: { value: "#d0f291" },
          300: { value: "#bef264" },
          400: { value: "#a3e635" },
          500: { value: "#8dcc22" },
          600: { value: "#6e9f1a" },
          700: { value: "#4d7c0f" },
          800: { value: "#3f6212" },
          900: { value: "#35530f" },
          950: { value: "#1a2e05" },
        },
        critical: {
          50: { value: "#fdf2f1" },
          100: { value: "#fbe3e1" },
          200: { value: "#f6c4c1" },
          300: { value: "#f2a7a2" },
          400: { value: "#e8756d" },
          500: { value: "#d9463e" },
          600: { value: "#c13129" },
          700: { value: "#a32821" },
          800: { value: "#85231d" },
          900: { value: "#6b1f1a" },
          950: { value: "#3a0f0c" },
        },
        /**
         * Borda translúcida — o que substitui a sombra. Card branco sobre papel
         * #f7f8fa é 1.06:1: sozinha, a superfície não desenha o card; quem
         * desenha é a borda. Translúcida funciona igual sobre branco, papel e
         * grafite, sem precisar de uma cor por superfície.
         */
        hairline: {
          soft: { value: "rgba(11, 15, 20, 0.06)" },
          DEFAULT: { value: "rgba(11, 15, 20, 0.10)" },
          strong: { value: "rgba(11, 15, 20, 0.16)" },
          softDark: { value: "rgba(247, 248, 250, 0.06)" },
          onDark: { value: "rgba(247, 248, 250, 0.10)" },
          strongDark: { value: "rgba(247, 248, 250, 0.18)" },
        },
        /**
         * Texto sobre grafite. Existe porque a sidebar é escura NOS DOIS MODOS:
         * lá dentro `fg`/`fg.muted` não servem (no claro são grafite, e grafite
         * sobre grafite não se lê). Medido sobre #0b0f14: .50 → 5.11:1,
         * .60 → 6.90:1, .72 → 9.56:1, .82 → 12.21:1.
         */
        onDark: {
          strong: { value: "rgba(247, 248, 250, 0.82)" },
          body: { value: "rgba(247, 248, 250, 0.72)" },
          muted: { value: "rgba(247, 248, 250, 0.60)" },
          label: { value: "rgba(247, 248, 250, 0.50)" },
        },
      },
      /**
       * Duas famílias, nenhuma terceira. O app declara `--font-sans` e
       * `--font-narrow` (next/font); sem elas cai no stack do sistema.
       * `numeric` é a narrow — métrica, KPI, preço, contador.
       *
       * `heading` NÃO carrega uppercase: metade dos títulos do painel é DADO
       * (`<Section title={cliente.nome}>`), e caixa-alta global faria o sistema
       * gritar um dado que ele não escreveu. Caixa-alta é opt-in.
       *
       * `mono` continua no stack do sistema: SKU, id, timestamp e dump de JSON
       * precisam desambiguar 0/O e 1/l/I e alinhar dentro de `<pre>`.
       */
      fonts: {
        heading: {
          value:
            "var(--font-narrow, var(--admin-font-heading, 'Archivo Narrow')), var(--font-sans, Archivo), 'Segoe UI', system-ui, sans-serif",
        },
        body: {
          value:
            "var(--font-sans, var(--admin-font-body, Archivo)), 'Segoe UI', system-ui, sans-serif",
        },
        numeric: {
          value:
            "var(--font-narrow, 'Archivo Narrow'), var(--font-sans, Archivo), 'Segoe UI', system-ui, sans-serif",
        },
      },
      /**
       * `radii.md` sozinho NÃO alcança botão, input e badge: o Chakra v3 roteia
       * as receitas por `borderRadius: "l2"`, e `l2 → {radii.sm}`. Por isso
       * `l2`/`l3` são reapontados nos semanticTokens.
       */
      radii: {
        md: { value: "9px" },
        lg: { value: "12px" },
        xl: { value: "16px" },
        "2xl": { value: "16px" },
      },
    },
    semanticTokens: {
      radii: {
        l2: { value: "{radii.md}" },
        l3: { value: "{radii.lg}" },
      },
      colors: {
        brand: {
          solid: { value: "#7062ed" },
          contrast: { value: "white" },
          fg: { value: { _light: "{colors.brand.600}", _dark: "{colors.brand.300}" } },
          muted: { value: { _light: "{colors.brand.100}", _dark: "{colors.brand.900}" } },
          subtle: { value: { _light: "{colors.brand.50}", _dark: "{colors.brand.950}" } },
          emphasized: { value: { _light: "{colors.brand.600}", _dark: "{colors.brand.400}" } },
          focusRing: { value: "{colors.brand.500}" },
        },
        /** A segunda voz forte do sistema — grafite, não uma cor concorrente. */
        accent: {
          solid: { value: { _light: "{colors.graphite.900}", _dark: "{colors.graphite.700}" } },
          contrast: { value: { _light: "white", _dark: "{colors.graphite.50}" } },
          fg: { value: { _light: "{colors.graphite.900}", _dark: "{colors.graphite.50}" } },
          muted: { value: { _light: "{colors.graphite.200}", _dark: "{colors.graphite.700}" } },
          subtle: { value: { _light: "{colors.graphite.100}", _dark: "{colors.graphite.750}" } },
          emphasized: { value: { _light: "{colors.graphite.800}", _dark: "{colors.graphite.600}" } },
          focusRing: { value: "{colors.graphite.500}" },
        },
        positive: {
          solid: { value: "{colors.positive.400}" },
          contrast: { value: "{colors.graphite.900}" },
          fg: { value: { _light: "{colors.positive.700}", _dark: "{colors.positive.300}" } },
          muted: { value: { _light: "{colors.positive.100}", _dark: "{colors.positive.900}" } },
          subtle: { value: { _light: "{colors.positive.50}", _dark: "{colors.positive.950}" } },
          emphasized: { value: { _light: "{colors.positive.600}", _dark: "{colors.positive.400}" } },
          focusRing: { value: "{colors.positive.600}" },
        },
        critical: {
          solid: { value: "#d3443c" },
          contrast: { value: "white" },
          fg: { value: { _light: "{colors.critical.600}", _dark: "{colors.critical.400}" } },
          muted: { value: { _light: "{colors.critical.100}", _dark: "{colors.critical.900}" } },
          subtle: { value: { _light: "{colors.critical.50}", _dark: "{colors.critical.950}" } },
          emphasized: { value: { _light: "{colors.critical.600}", _dark: "{colors.critical.400}" } },
          focusRing: { value: "{colors.critical.500}" },
        },
        /**
         * Escada de superfície:
         *   claro:  papel #f7f8fa → card BRANCO + borda → interno #f1f2f5
         *   escuro: body #070a0e → shell #0b0f14 → card #151b23 → interno #1c2430
         * No escuro o interno é mais CLARO que o card; no claro, mais escuro —
         * a luz vem de cima nos dois.
         */
        bg: {
          DEFAULT: { value: { _light: "white", _dark: "{colors.graphite.800}" } },
          subtle: { value: { _light: "{colors.graphite.50}", _dark: "{colors.graphite.900}" } },
          muted: { value: { _light: "{colors.graphite.100}", _dark: "{colors.graphite.750}" } },
          emphasized: { value: { _light: "{colors.graphite.200}", _dark: "{colors.graphite.700}" } },
          panel: { value: { _light: "white", _dark: "{colors.graphite.800}" } },
          inset: { value: { _light: "{colors.graphite.100}", _dark: "{colors.graphite.750}" } },
        },
        border: {
          DEFAULT: { value: { _light: "{colors.hairline}", _dark: "{colors.hairline.onDark}" } },
          muted: { value: { _light: "{colors.hairline.soft}", _dark: "{colors.hairline.softDark}" } },
          emphasized: {
            value: { _light: "{colors.hairline.strong}", _dark: "{colors.hairline.strongDark}" },
          },
        },
        fg: {
          DEFAULT: { value: { _light: "{colors.graphite.900}", _dark: "{colors.graphite.50}" } },
          muted: { value: { _light: "{colors.graphite.600}", _dark: "{colors.graphite.400}" } },
          subtle: { value: { _light: "{colors.graphite.500}", _dark: "{colors.graphite.500}" } },
        },
      },
      /**
       * Relevo por modo: no claro um fio + uma sombra larga e muito
       * transparente (spread negativo) que só escurece o papel em volta; no
       * escuro `inset 0 1px 0` de branco a 5% — a linha de luz no topo do
       * cartão, porque preto sobre preto não desenha nada.
       */
      shadows: {
        card: {
          value: {
            _light: "0 1px 2px rgba(11,15,20,0.05), 0 10px 24px -16px rgba(11,15,20,0.18)",
            _dark: "inset 0 1px 0 rgba(247,248,250,0.05)",
          },
        },
        cardHover: {
          value: {
            _light: "0 2px 4px rgba(11,15,20,0.06), 0 18px 34px -20px rgba(11,15,20,0.26)",
            _dark: "inset 0 1px 0 rgba(247,248,250,0.09)",
          },
        },
        brandGlow: {
          value: {
            _light: "0 10px 30px rgba(117,103,248,0.40)",
            _dark: "0 10px 30px rgba(117,103,248,0.30)",
          },
        },
      },
    },
  },
  globalCss: {
    /**
     * Badge é `inline-flex` e não quebra por padrão, então rótulo longo empurra
     * a página de lado. A regra só age quando o badge NÃO CABE. O seletor leva
     * o ELEMENTO junto da classe: só `.chakra-badge` empata com a receita do
     * Chakra e o `white-space: nowrap` dela ganha.
     */
    "span.chakra-badge": {
      maxWidth: "100%",
      whiteSpace: "normal",
      overflowWrap: "anywhere",
    },
    ":root": {
      "--sb-thumb": "rgba(11, 15, 20, 0.22)",
      "--sb-thumb-hover": "rgba(11, 15, 20, 0.40)",
    },
    ":root.dark": {
      "--sb-thumb": "rgba(247, 248, 250, 0.22)",
      "--sb-thumb-hover": "rgba(247, 248, 250, 0.45)",
    },
    /**
     * `_dark` compila para `.dark &`, que casa com o body mas NUNCA com o
     * próprio `<html>` — sem a regra explícita, no escuro o html fica claro e
     * qualquer overscroll revela uma faixa branca por trás do app.
     */
    "html.dark": {
      bg: "graphite.950",
      color: "graphite.50",
    },
    /** Barra fina e invisível até o ponteiro entrar na área rolável. */
    "*": {
      scrollbarWidth: "thin",
      scrollbarColor: "transparent transparent",
      transition: "scrollbar-color 0.2s ease",
    },
    "*:hover, *:focus-within": { scrollbarColor: "var(--sb-thumb) transparent" },
    "*::-webkit-scrollbar": { width: "10px", height: "10px" },
    "*::-webkit-scrollbar-track": { background: "transparent" },
    "*::-webkit-scrollbar-thumb": {
      background: "transparent",
      borderRadius: "999px",
      border: "3px solid transparent",
      backgroundClip: "content-box",
      transition: "background-color 0.2s ease",
    },
    "*:hover::-webkit-scrollbar-thumb": {
      background: "var(--sb-thumb)",
      backgroundClip: "content-box",
    },
    "*::-webkit-scrollbar-thumb:hover": {
      background: "var(--sb-thumb-hover)",
      backgroundClip: "content-box",
    },
  },
});
