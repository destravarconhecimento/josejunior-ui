"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Captcha dos formulários públicos (Cloudflare Turnstile).
 *
 * É o MESMO widget nos quatro sites (josejunior.dev, páginas de venda, sites dos
 * representantes, landings de anúncio) porque a chave e o liga/desliga vivem num
 * lugar só: o sistema. O componente NÃO decide se o captcha existe — ele pergunta
 * (`GET {sistemaBase}/api/captcha`) e some quando está desligado. Quem realmente
 * barra o spam é o servidor, ao validar o token; isto aqui só o produz.
 *
 * Sem Chakra de propósito: o Turnstile desenha a própria caixa e o componente
 * roda igual no app com Tailwind (representantes) e nos com Chakra.
 */

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void; "error-callback"?: () => void; theme?: string },
  ) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_ID = "cf-turnstile-script";
// URL EXATA da Cloudflare — a doc proíbe proxy/cache e não existe host alternativo
// (`challenge.platform.cloudflare.com` NÃO resolve: o widget nunca carregava).
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Carrega o script uma única vez por página e resolve quando a API existe. */
function carregarTurnstile(): Promise<TurnstileApi | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.turnstile) return Promise.resolve(window.turnstile);
  return new Promise((resolve) => {
    if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }
    // O script expõe `window.turnstile` de forma assíncrona — espera curta com teto.
    let tentativas = 0;
    const timer = window.setInterval(() => {
      if (window.turnstile) {
        window.clearInterval(timer);
        resolve(window.turnstile);
      } else if (++tentativas > 100) {
        window.clearInterval(timer);
        resolve(null);
      }
    }, 100);
  });
}

export type CaptchaProps = {
  /** Recebe o token a enviar junto do formulário (""= expirou/erro, refazer). */
  onToken: (token: string) => void;
  /** Base do app SISTEMA (onde mora a config). Default = produção. */
  sistemaBase?: string;
  /** Avisa se o captcha está ligado — o form pode exigir o token antes de enviar. */
  onEnabled?: (enabled: boolean) => void;
  theme?: "light" | "dark" | "auto";
};

export function Captcha({ onToken, sistemaBase, onEnabled, theme = "auto" }: CaptchaProps) {
  const base = (sistemaBase || "https://sistema.josejunior.dev").replace(/\/+$/, "");
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const box = useRef<HTMLDivElement | null>(null);
  // Refs pros callbacks: o efeito de render não deve reiniciar o widget quando o
  // pai re-renderiza (reiniciar = o usuário resolver o desafio duas vezes).
  const cbToken = useRef(onToken);
  const cbEnabled = useRef(onEnabled);
  cbToken.current = onToken;
  cbEnabled.current = onEnabled;

  useEffect(() => {
    let vivo = true;
    // Manda o próprio hostname: o Turnstile valida domínio, então site de rep com
    // domínio próprio recebe a site key do widget dele, não a nossa.
    const host = typeof window === "undefined" ? "" : window.location.hostname;
    fetch(`${base}/api/captcha?host=${encodeURIComponent(host)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { enabled?: boolean; siteKey?: string } | null) => {
        if (!vivo) return;
        const on = Boolean(d?.enabled && d?.siteKey);
        setSiteKey(on ? d!.siteKey! : null);
        cbEnabled.current?.(on);
      })
      .catch(() => {
        // Sistema fora do ar não pode travar o formulário: segue sem captcha.
        if (vivo) cbEnabled.current?.(false);
      });
    return () => {
      vivo = false;
    };
  }, [base]);

  useEffect(() => {
    if (!siteKey || !box.current) return;
    let widgetId: string | null = null;
    let vivo = true;
    void carregarTurnstile().then((api) => {
      if (!vivo) return;
      if (!api || !box.current) {
        // Script bloqueado (extensão, rede corporativa, Cloudflare fora): solta a
        // trava do botão. O servidor continua validando — o visitante pelo menos
        // recebe um erro que dá pra entender, em vez de um formulário morto.
        cbEnabled.current?.(false);
        return;
      }
      widgetId = api.render(box.current, {
        sitekey: siteKey,
        theme,
        callback: (token) => cbToken.current(token),
        "expired-callback": () => cbToken.current(""),
        "error-callback": () => cbToken.current(""),
      });
    });
    return () => {
      vivo = false;
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          /* widget já removido com o DOM */
        }
      }
    };
  }, [siteKey, theme]);

  if (!siteKey) return null;
  return <div ref={box} style={{ margin: "8px 0" }} />;
}
