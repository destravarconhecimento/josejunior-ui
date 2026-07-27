/**
 * Contrato de TEMPO REAL por INJEÇÃO — o `@josejunior/ui` continua PURO.
 *
 * Nenhum componente daqui conhece Ably, SSE ou fetch. Quem sabe disso é o app,
 * que passa esta função como prop: "me avise quando algo mudar neste assunto".
 * O componente devolve o cancelamento no unmount e pronto. É o mesmo desenho
 * do i18n (engine por injeção) — a UI depende do FORMATO, nunca do transporte.
 *
 * Compatível de estrutura com o `RealtimeSubscribe` do `@josejunior/realtime`,
 * sem que o `ui` precise depender dele.
 */

/** Um aviso: só o nome do evento e um payload livre (a tela recarrega o que precisa). */
export type UiRealtimeEvent = { name: string; data?: unknown };

/** `(aviso) => cancelar`. Prop opcional: sem ela, o componente segue no ciclo de sempre. */
export type UiRealtimeSubscribe = (aviso: (evento: UiRealtimeEvent) => void) => () => void;
