import { Button as ChakraButton, type ButtonProps } from "@chakra-ui/react";

export type ButtonTone = "primary" | "outline" | "ghost" | "danger";

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
};

/** Botão padrão do painel. `tone` aplica o estilo da marca (lê --admin-*). */
export function Button({
  tone = "primary",
  ...props
}: { tone?: ButtonTone } & ButtonProps) {
  return <ChakraButton borderRadius="10px" fontWeight="600" {...toneProps[tone]} {...props} />;
}
