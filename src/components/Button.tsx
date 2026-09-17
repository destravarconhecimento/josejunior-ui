import { Button as ChakraButton, type ButtonProps } from "@chakra-ui/react";

export type ButtonTone = "primary" | "outline" | "ghost" | "danger" | "whatsapp";

/**
 * O PAPEL do botão — o vocabulário que veio do 8899br, onde nasceu de uma
 * medição: `Button` do Chakra importado direto em 120 telas, cada uma
 * escolhendo `size`/`variant`/`colorPalette` por conta. A mesma ação ("salvar",
 * "excluir", "ver") tinha três caras em três telas. O papel tem UMA cara.
 *
 * É o mesmo eixo do `tone`, em português e do ponto de vista de quem escreve a
 * tela; o mapa abaixo é a tradução entre os dois.
 */
export type PapelDeBotao = "principal" | "secundario" | "perigoso" | "discreto";

export const TONE_DO_PAPEL: Record<PapelDeBotao, ButtonTone> = {
  principal: "primary",
  secundario: "outline",
  perigoso: "danger",
  discreto: "ghost",
};

const toneProps: Record<ButtonTone, ButtonProps> = {
  primary: {
    bg: "var(--admin-primary)",
    color: "white",
    _hover: { bg: "var(--admin-primary-dark)" },
  },
  outline: {
    variant: "outline",
    borderColor: "var(--admin-border)",
    color: "var(--admin-primary)",
    _hover: { bg: "var(--admin-nav-hover)" },
  },
  ghost: {
    variant: "ghost",
    color: "var(--admin-text-soft)",
    _hover: { bg: "var(--admin-nav-hover)", color: "var(--admin-primary)" },
  },
  danger: {
    bg: "#dc2626",
    color: "white",
    _hover: { bg: "#b91c1c" },
  },
  whatsapp: {
    bg: "#25D366",
    color: "white",
    _hover: { bg: "#1DA851" },
  },
};

/**
 * Botão padrão do painel. `tone` aplica o estilo da marca (lê --admin-*).
 *
 * Ponte de compatibilidade: se o chamador usar a API antiga do Chakra
 * (`variant`/`colorPalette`) SEM `tone`, o botão respeita esses props (assim a
 * migração de telas legadas é só trocar o import, sem reescrever cada botão).
 * Em código novo, use `tone`.
 */
export function Button({
  tone,
  variant,
  colorPalette,
  ...props
}: { tone?: ButtonTone } & ButtonProps) {
  if (!tone && (variant || colorPalette)) {
    return (
      <ChakraButton
        borderRadius="10px"
        fontWeight="600"
        variant={variant}
        colorPalette={colorPalette}
        {...props}
      />
    );
  }
  return (
    <ChakraButton borderRadius="10px" fontWeight="600" {...toneProps[tone ?? "primary"]} {...props} />
  );
}
