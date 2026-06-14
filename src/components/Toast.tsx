"use client";

import {
  Toaster as ChakraToaster,
  Toast as ChakraToast,
  createToaster,
  Portal,
  Spinner,
  Stack,
} from "@chakra-ui/react";

/** Store global dos toasts (singleton). `toast.*` empurra; <Toaster/> renderiza. */
export const toaster = createToaster({
  placement: "top-end",
  pauseOnPageIdle: true,
});

/**
 * Monte UMA vez no layout (já montado no painel). Renderiza os toasts no canto,
 * com a cara do admin (tokens --admin-*). Substitui caixas de alerta na tela.
 */
export function Toaster() {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(t) => (
          <ChakraToast.Root
            width={{ base: "full", md: "sm" }}
            bg="var(--admin-surface, #fff)"
            color="var(--admin-text, #0f172a)"
            borderWidth="1px"
            borderColor="var(--admin-border, #e2e8f0)"
            borderRadius="12px"
            boxShadow="0 16px 40px rgba(15,23,42,0.18)"
          >
            {t.type === "loading" ? (
              <Spinner size="sm" color="var(--admin-primary)" borderWidth="2px" />
            ) : (
              <ChakraToast.Indicator />
            )}
            <Stack gap="1" flex="1" maxWidth="100%">
              {t.title ? <ChakraToast.Title>{t.title}</ChakraToast.Title> : null}
              {t.description ? (
                <ChakraToast.Description>{t.description}</ChakraToast.Description>
              ) : null}
            </Stack>
            {t.action ? (
              <ChakraToast.ActionTrigger>{t.action.label}</ChakraToast.ActionTrigger>
            ) : null}
            <ChakraToast.CloseTrigger />
          </ChakraToast.Root>
        )}
      </ChakraToaster>
    </Portal>
  );
}

/** Helpers — use em client components: `toast.success("Salvo!")`, `toast.error(...)`. */
export const toast = {
  success: (title: string, description?: string) =>
    toaster.create({ type: "success", title, description }),
  error: (title: string, description?: string) =>
    toaster.create({ type: "error", title, description, duration: 6000 }),
  info: (title: string, description?: string) =>
    toaster.create({ type: "info", title, description }),
  warning: (title: string, description?: string) =>
    toaster.create({ type: "warning", title, description }),
  loading: (title: string, description?: string) =>
    toaster.create({ type: "loading", title, description }),
  dismiss: (id?: string) => toaster.dismiss(id),
};
