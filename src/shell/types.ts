import type { ReactNode } from "react";

export type NavItem = {
  href: string;
  label: string;
  icon?: ReactNode;
  badge?: string;
  description?: string;
  exact?: boolean;
  group?: string;
};

export type NavSection = {
  title: string;
  icon?: ReactNode;
  items: NavItem[];
};

export type Brand = {
  name: string;
  logoUrl?: string;
  darkLogoUrl?: string;
  wideLogoUrl?: string;
};

export type AppUser = {
  name?: string | null;
  email?: string | null;
  initials?: string;
  image?: string | null;
  color?: string | null;
  roleLabel?: string | null;
};
