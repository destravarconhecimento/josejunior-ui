import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
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
