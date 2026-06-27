import { Button as ChakraButton, type ButtonProps } from "@chakra-ui/react";

export type ButtonTone = "primary" | "outline" | "ghost" | "danger" | "whatsapp";

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
