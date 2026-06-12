"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import type { ButtonTone } from "./Button";

type ConfirmOpts = {
  title?: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ButtonTone;
};

/**
 * Substituto imperativo do `window.confirm()` com o ConfirmDialog do painel:
 *   const { confirm, confirmDialog } = useConfirm();
 *   ...
 *   if (!(await confirm({ title: "Excluir?" , tone: "danger" }))) return;
 *   ...
 *   return <>{...tela...}{confirmDialog}</>;
 */
export function useConfirm() {
  const [opts, setOpts] = useState<ConfirmOpts | null>(null);
  const resolver = useRef<(ok: boolean) => void>(() => {});

  const confirm = useCallback((o: ConfirmOpts = {}) => {
    setOpts(o);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (ok: boolean) => {
    resolver.current(ok);
    setOpts(null);
  };

  const confirmDialog = (
    <ConfirmDialog
      open={opts != null}
      onClose={() => close(false)}
      onConfirm={() => close(true)}
      title={opts?.title ?? "Confirmar"}
      description={opts?.description}
      confirmLabel={opts?.confirmLabel ?? "Confirmar"}
      cancelLabel={opts?.cancelLabel ?? "Cancelar"}
      tone={opts?.tone ?? "primary"}
    />
  );

  return { confirm, confirmDialog };
}
