"use client";
/**
 * Undo/redo genérico (duas pilhas) com GRANULARIDADE — a parte que o doc
 * (editor-flyers-docs.md §6) diz ser importante preservar:
 *  - Ações discretas (add/del/duplicar/toggle) → 1 snapshot antes da mudança.
 *  - Gestos contínuos (arrastar/redimensionar) → `transient`: aplica sem empilhar
 *    e só registra 1 snapshot pré-gesto no `endTransient` (nada de 1 por pixel).
 *  - Digitar/arrastar cor → `coalesce`: empilha só a 1ª mudança de uma "rajada"
 *    (janela de ~700ms com a mesma chave); as seguintes não geram lixo.
 */
import { useCallback, useRef, useState } from "react";

export type SetMode = { transient?: boolean; coalesce?: string };

export type HistoryApi<T> = {
  state: T;
  set: (next: T | ((prev: T) => T), mode?: SetMode) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (next: T) => void;
  beginTransient: () => void;
  endTransient: () => void;
};

const LIMIT = 80;
const COALESCE_MS = 700;

export function useHistory<T>(initial: T): HistoryApi<T> {
  const [state, setState] = useState<T>(initial);
  const stateRef = useRef<T>(initial);
  stateRef.current = state;

  const undoRef = useRef<T[]>([]);
  const redoRef = useRef<T[]>([]);
  const transientSnap = useRef<T | null>(null);
  const coalesceRef = useRef<{ key: string; t: number } | null>(null);
  const [, force] = useState(0);
  const bump = () => force((n) => n + 1);

  const pushUndo = (snapshot: T) => {
    undoRef.current.push(snapshot);
    if (undoRef.current.length > LIMIT) undoRef.current.shift();
    redoRef.current = [];
  };
  const apply = (next: T | ((prev: T) => T)) => {
    setState((prev) => {
      const value = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
      stateRef.current = value;
      return value;
    });
  };

  const set = useCallback((next: T | ((prev: T) => T), mode?: SetMode) => {
    const prev = stateRef.current;
    if (mode?.transient) {
      if (transientSnap.current === null) transientSnap.current = prev;
      apply(next);
      return;
    }
    if (mode?.coalesce) {
      const now = Date.now();
      const last = coalesceRef.current;
      const fresh = !last || last.key !== mode.coalesce || now - last.t > COALESCE_MS;
      if (fresh) pushUndo(prev);
      coalesceRef.current = { key: mode.coalesce, t: now };
      apply(next);
      bump();
      return;
    }
    coalesceRef.current = null;
    pushUndo(prev);
    apply(next);
    bump();
  }, []);

  const beginTransient = useCallback(() => {
    transientSnap.current = null;
  }, []);
  const endTransient = useCallback(() => {
    if (transientSnap.current !== null) {
      pushUndo(transientSnap.current);
      transientSnap.current = null;
      bump();
    }
  }, []);

  const undo = useCallback(() => {
    if (!undoRef.current.length) return;
    const prev = undoRef.current.pop() as T;
    redoRef.current.push(stateRef.current);
    coalesceRef.current = null;
    apply(prev);
    bump();
  }, []);
  const redo = useCallback(() => {
    if (!redoRef.current.length) return;
    const next = redoRef.current.pop() as T;
    undoRef.current.push(stateRef.current);
    coalesceRef.current = null;
    apply(next);
    bump();
  }, []);
  const reset = useCallback((next: T) => {
    undoRef.current = [];
    redoRef.current = [];
    coalesceRef.current = null;
    transientSnap.current = null;
    apply(next);
    bump();
  }, []);

  return {
    state,
    set,
    undo,
    redo,
    canUndo: undoRef.current.length > 0,
    canRedo: redoRef.current.length > 0,
    reset,
    beginTransient,
    endTransient,
  };
}
