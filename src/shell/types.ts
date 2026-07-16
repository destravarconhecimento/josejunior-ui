import type { ReactNode } from "react";

export type NavItem = {
  href: string;
  label: string;
  /** Ícone JÁ renderizado (ex.: <Mail size={18} />). Não passe o componente
   *  do ícone cru — funções não cruzam a fronteira Server→Client. */
  icon?: ReactNode;
  badge?: string;
  /** Subtítulo opcional exibido sob o label (só na sidebar do AppShell). */
  description?: string;
};

export type NavSection = {
  title: string;
  /** Ícone JÁ renderizado do GRUPO (ex.: <Boxes size={16} />), exibido junto do
   *  título no botão da topbar. Mesma regra do `NavItem.icon`: nunca o
   *  componente cru — funções não cruzam a fronteira Server→Client. */
  icon?: ReactNode;
  items: NavItem[];
};

export type Brand = {
  name: string;
  logoUrl?: string;
  /** Variante do ícone pra FUNDO ESCURO (sidebar). Se ausente, o `logoUrl` é
   *  pintado de branco via filtro CSS. */
  darkLogoUrl?: string;
  /** Logo HORIZONTAL completo (com nome/tagline) pra topbar de marca — usado no
   *  `topbarVariant="brand"` do portal. Cai no `logoUrl` (ícone) se ausente. */
  wideLogoUrl?: string;
};

export type AppUser = {
  name?: string | null;
  email?: string | null;
  initials?: string;
  /** URL da foto do usuário (avatar). Se houver, o avatar mostra a imagem. */
  image?: string | null;
  /** Cor da equipe (hex) — tom do avatar de iniciais quando não há foto. */
  color?: string | null;
  /** Papel para exibir sob o nome (ex.: "Administrador"). */
  roleLabel?: string | null;
};
