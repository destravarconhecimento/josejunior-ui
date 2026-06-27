import { forwardRef } from "react";
import {
  Input as ChakraInput,
  Textarea as ChakraTextarea,
  IconButton as ChakraIconButton,
  Field as CField,
  NativeSelect as CNativeSelect,
  Switch as CSwitch,
  Badge as CBadge,
  type InputProps,
  type TextareaProps,
  type IconButtonProps,
  type BadgeProps,
} from "@chakra-ui/react";

/**
 * Controles de baixo nível DO design-system (montados aqui, fonte única). São
 * componentes do ui — não re-export cru do Chakra — com o estilo padrão do
 * painel (`--admin-*`) já embutido. Os painéis usam ESTES; o estilo muda só aqui.
 *
 * Para campo com label/erro, prefira `FormInput`/`FormTextarea`/`FormField`.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  return (
    <ChakraInput
      ref={ref}
      bg="var(--admin-surface)"
      borderColor="var(--admin-border)"
      _focusVisible={{
        borderColor: "var(--admin-primary)",
        boxShadow: "0 0 0 1px var(--admin-primary)",
      }}
      {...props}
    />
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(props, ref) {
  return (
    <ChakraTextarea
      ref={ref}
      bg="var(--admin-surface)"
      borderColor="var(--admin-border)"
      _focusVisible={{
        borderColor: "var(--admin-primary)",
        boxShadow: "0 0 0 1px var(--admin-primary)",
      }}
      {...props}
    />
  );
});

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(props, ref) {
  return <ChakraIconButton ref={ref} {...props} />;
});

/** Campo composto (label + controle) — ui-owned; Label estilizado --admin. */
export const Field = {
  Root: CField.Root,
  Label: (p: React.ComponentProps<typeof CField.Label>) => (
    <CField.Label color="var(--admin-primary)" fontWeight="600" fontSize="sm" {...p} />
  ),
  HelperText: (p: React.ComponentProps<typeof CField.HelperText>) => (
    <CField.HelperText fontSize="xs" {...p} />
  ),
  ErrorText: CField.ErrorText,
  RequiredIndicator: CField.RequiredIndicator,
};

/** Select nativo composto — ui-owned; Field com superfície do painel. */
export const NativeSelect = {
  Root: CNativeSelect.Root,
  Field: (p: React.ComponentProps<typeof CNativeSelect.Field>) => (
    <CNativeSelect.Field
      bg="var(--admin-surface)"
      borderColor="var(--admin-border)"
      {...p}
    />
  ),
  Indicator: CNativeSelect.Indicator,
};

/** Switch composto — ui-owned; Control marcado usa a cor primária do painel. */
export const Switch = {
  Root: CSwitch.Root,
  HiddenInput: CSwitch.HiddenInput,
  Control: (p: React.ComponentProps<typeof CSwitch.Control>) => (
    <CSwitch.Control _checked={{ bg: "var(--admin-primary)" }} {...p} />
  ),
  Thumb: CSwitch.Thumb,
  Label: CSwitch.Label,
};

/** Badge — ui-owned (cantos/peso padrão); `colorPalette` continua valendo. */
export function Badge(props: BadgeProps) {
  return <CBadge borderRadius="6px" fontWeight="600" {...props} />;
}

export type { InputProps, TextareaProps, IconButtonProps, BadgeProps };
