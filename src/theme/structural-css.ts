/**
 * CSS estrutural do painel — ESTÁTICO e compartilhado pelos dois apps. Usa só
 * `var(--admin-*)`, então a marca (cores/fontes) vem da paleta de cada app.
 * Cobre: shell, títulos, cards, top bar, botões de nav, dropdown, item de nav,
 * drawer mobile e scrollbar.
 */
export const ADMIN_STRUCTURAL_CSS = `
.admin-shell { background: var(--admin-bg); min-height: 100vh; color: var(--admin-text); }
.admin-shell, .admin-shell * { font-family: var(--admin-font-body); }
.admin-shell h1, .admin-shell h2, .admin-shell .admin-h {
  font-family: var(--admin-font-heading);
  letter-spacing: var(--admin-heading-ls, -0.2px);
}
.admin-card {
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 16px;
  box-shadow: var(--admin-card-shadow);
  transition: box-shadow 170ms ease, transform 170ms ease, border-color 170ms ease;
}
/* Cards clicáveis (data-interactive) ganham elevação no hover — o resto fica estático. */
.admin-card[data-interactive="true"] { cursor: pointer; }
.admin-card[data-interactive="true"]:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--admin-primary) 32%, var(--admin-border));
  box-shadow: 0 14px 34px -16px rgba(2, 6, 23, 0.28);
}
.admin-topbar {
  background: color-mix(in srgb, var(--admin-surface) 82%, transparent);
  border-bottom: 1px solid var(--admin-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
.admin-navbtn {
  cursor: pointer;
  color: var(--admin-text-soft);
  transition: background 140ms ease, color 140ms ease;
  border: none;
  background: transparent;
}
.admin-navbtn:hover,
.admin-navbtn[data-open="true"],
.admin-navbtn[data-active="true"] {
  background: var(--admin-nav-hover);
  color: var(--admin-primary);
}
.admin-dropdown {
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 14px;
  box-shadow: var(--admin-card-shadow);
  backdrop-filter: blur(14px);
}
.admin-nav-item {
  position: relative;
  transition: background 140ms ease, color 140ms ease;
  color: var(--admin-text);
}
.admin-nav-item:hover { background: var(--admin-nav-hover); }
.admin-nav-item[data-active="true"] {
  background: linear-gradient(90deg, var(--admin-nav-active), color-mix(in srgb, var(--admin-nav-active) 25%, transparent));
  color: var(--admin-primary);
  font-weight: 600;
}
/* Barra de destaque com gradiente roxo→dourado (premium) no item ativo. */
.admin-nav-item[data-active="true"]::before {
  content: "";
  position: absolute;
  left: 0; top: 6px; bottom: 6px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: linear-gradient(180deg, var(--admin-primary), var(--admin-accent));
}
/* Foco acessível e consistente em tudo que é interativo no painel. */
.admin-shell a:focus-visible,
.admin-shell button:focus-visible,
.admin-navbtn:focus-visible,
.admin-nav-item:focus-visible,
.admin-card[data-interactive="true"]:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--admin-primary) 55%, transparent);
  outline-offset: 2px;
  border-radius: 8px;
}
/* ── Sidebar escura (layout premium) ──────────────────────────────────────── */
.admin-sidebar {
  background:
    radial-gradient(120% 55% at 0% 0%, color-mix(in srgb, var(--admin-primary) 30%, transparent), transparent 58%),
    radial-gradient(90% 40% at 100% 100%, color-mix(in srgb, var(--admin-accent) 14%, transparent), transparent 60%),
    linear-gradient(180deg, var(--admin-dark), color-mix(in srgb, var(--admin-dark) 80%, #000));
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.05), 6px 0 32px -18px rgba(0, 0, 0, 0.6);
  color: rgba(255, 255, 255, 0.72);
  transition: width 0.18s ease;
}
.admin-side-title { color: rgba(255, 255, 255, 0.40); }
.admin-side-item {
  position: relative;
  color: rgba(255, 255, 255, 0.70);
  border-radius: 10px;
  transition: background 140ms ease, color 140ms ease;
}
.admin-side-item:hover { background: rgba(255, 255, 255, 0.07); color: #fff; }
.admin-side-item[data-active="true"] {
  background: linear-gradient(90deg, color-mix(in srgb, var(--admin-primary) 46%, transparent), color-mix(in srgb, var(--admin-accent) 16%, transparent));
  color: #fff;
  font-weight: 600;
}
.admin-side-item[data-active="true"]::before {
  content: "";
  position: absolute;
  left: 0; top: 6px; bottom: 6px;
  width: 3px; border-radius: 0 3px 3px 0;
  background: linear-gradient(180deg, var(--admin-primary), var(--admin-accent));
}
.admin-sidebar .admin-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.14); }
.admin-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
.admin-scroll::-webkit-scrollbar-thumb { background: var(--admin-border); border-radius: 4px; }
.admin-scroll::-webkit-scrollbar-thumb:hover { background: var(--admin-text-soft); }
.admin-scroll { scrollbar-width: thin; scrollbar-color: var(--admin-border) transparent; }
/* Respeita quem prefere menos movimento (acessibilidade). */
@media (prefers-reduced-motion: reduce) {
  .admin-card, .admin-card[data-interactive="true"]:hover { transition: none; transform: none; }
}
`;
