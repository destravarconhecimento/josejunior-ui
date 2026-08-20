/**
 * CSS estrutural do painel — ESTÁTICO e compartilhado pelos dois apps. Usa só
 * `var(--admin-*)`, então a marca (cores/fontes) vem da paleta de cada app.
 * Cobre: shell, títulos, cards, top bar, botões de nav, dropdown, item de nav,
 * drawer mobile e scrollbar.
 */
export const ADMIN_STRUCTURAL_CSS = `
@keyframes jjProgressIndeterminate {
  0% { left: -40%; }
  100% { left: 100%; }
}
.admin-shell { background: var(--admin-bg); min-height: 100vh; color: var(--admin-text); }
.admin-shell, .admin-shell * { font-family: var(--admin-font-body); }
.admin-shell h1, .admin-shell h2, .admin-shell .admin-h {
  font-family: var(--admin-font-heading);
  letter-spacing: var(--admin-heading-ls, -0.2px);
}
/* ── Painel ACOPLADO (o FAB encostado na direita) ──────────────────────────
   Encostado, o painel não pode TAPAR a página: o shell reserva a coluna com
   \`padding-right: var(--jj-fab-dock)\` e a página encolhe. A reserva só liga em
   \`lg\` — abaixo disso a janela é estreita demais pra doar 420px, e lá o painel
   continua por cima (comportamento antigo). O \`<html>\` ganha data-fab-dock="1"
   e a largura crua enquanto durar; ver \`components/fab/dock.ts\`. */
:root { --jj-fab-dock: 0px; }
@media (min-width: 62em) {
  html[data-fab-dock="1"] { --jj-fab-dock: var(--jj-fab-dock-w, 0px); }
}
.admin-card {
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 14px;
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
/* Topbar de MARCA (portal do cliente): MESMO tratamento do sidebar escuro do
   AppShell (o José preferiu essa cor de fundo à primária chapada) — base
   --admin-dark com brilhos radiais da primária/accent. Só que na HORIZONTAL: os
   brilhos entram pelas PONTAS (primária à esquerda, junto do logo; accent à
   direita, nos utilitários), porque a versão vertical do sidebar não casa numa
   barra baixa e larga. Conteúdo claro (logo, sino, avatar) — igual ao sidebar.
   Opt-in via topbarVariant="brand"; o painel staff/sistema segue "vidro" acima. */
.admin-topbar[data-variant="brand"] {
  background:
    radial-gradient(45% 320% at 0% 50%, color-mix(in srgb, var(--admin-primary) 36%, transparent), transparent 62%),
    radial-gradient(42% 300% at 100% 50%, color-mix(in srgb, var(--admin-accent) 20%, transparent), transparent 62%),
    linear-gradient(180deg, var(--admin-dark), color-mix(in srgb, var(--admin-dark) 82%, #000));
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
/* Navegação DENTRO da topbar de marca: os botões de grupo (TopNav) e o
   hambúrguer (MobileNav) ficam claros sobre a cor do tenant. O dropdown e o
   drawer são portados pra fora da topbar e seguem no tema claro — só os
   GATILHOS mudam. A GroupRail vive ABAIXO da topbar (no fundo do painel), então
   este seletor descendente não a alcança: ela continua no tema claro, de
   propósito. */
.admin-topbar[data-variant="brand"] .admin-navbtn { color: rgba(255, 255, 255, 0.82); }
/* Aberto/ativo acende na PRIMÁRIA, não num véu branco: sobre o fundo escuro do
   site, o branco translúcido dava um cinza sem dono e o grupo aberto parecia
   apenas "menos apagado". Com a primária chapada, o grupo em que ela está é a
   única coisa colorida da barra — e é a cor da marca, então continua sendo a
   cor do tenant em cada painel. */
.admin-topbar[data-variant="brand"] .admin-navbtn:hover {
  background: color-mix(in srgb, var(--admin-primary) 42%, transparent);
  color: #fff;
}
.admin-topbar[data-variant="brand"] .admin-navbtn[data-open="true"],
.admin-topbar[data-variant="brand"] .admin-navbtn[data-active="true"] {
  background: var(--admin-primary);
  color: #fff;
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
  border-radius: 12px;
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
