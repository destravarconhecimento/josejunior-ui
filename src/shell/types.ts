import type { ReactNode } from "react";

export type NavItem = {
  href: string;
  label: string;
  /** Ícone JÁ renderizado (ex.: <Mail size={18} />). Não passe o componente
   *  do ícone cru — funções não cruzam a fronteira Server→Client. */
  icon?: ReactNode;
  badge?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export type Brand = {
  name: string;
  logoUrl?: string;
};

export type AppUser = {
  name?: string | null;
  email?: string | null;
  initials?: string;
};
