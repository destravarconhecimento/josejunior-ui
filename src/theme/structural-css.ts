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
}
.admin-topbar {
  background: var(--admin-surface);
  border-bottom: 1px solid var(--admin-border);
  backdrop-filter: blur(14px);
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
  background: var(--admin-nav-active);
  color: var(--admin-primary);
  font-weight: 600;
}
.admin-nav-item[data-active="true"]::before {
  content: "";
  position: absolute;
  left: 0; top: 7px; bottom: 7px;
  width: 3px;
  border-radius: 2px;
  background: var(--admin-accent);
}
.admin-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.admin-scroll::-webkit-scrollbar-thumb { background: var(--admin-border); border-radius: 3px; }
`;
