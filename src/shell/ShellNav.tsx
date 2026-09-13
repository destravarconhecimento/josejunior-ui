"use client";

import { createContext, useContext, useMemo, type AnchorHTMLAttributes, type ComponentType, type ReactNode, type Ref } from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { NavItem } from "./types";

export type ShellLinkComponent = ComponentType<
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; ref?: Ref<HTMLAnchorElement> }
>;

export type ShellTextos = {
  menuPrincipal: string;
  abrirMenu: string;
  menu: string;
  buscarNoMenu: string;
  buscarNoMenuAria: string;
  nadaEncontrado: string;
  maisUsados: string;
  expandirSubmenu: string;
  recolherSubmenu: string;
  contaSenha: string;
  irParaSite: string;
  notificacoes: string;
  irPara: string;
  nadaPendente: string;
};

export const SHELL_TEXTOS_PT: ShellTextos = {
  menuPrincipal: "Menu principal",
  abrirMenu: "Abrir menu",
  menu: "Menu",
  buscarNoMenu: "Buscar no menu…",
  buscarNoMenuAria: "Buscar no menu",
  nadaEncontrado: "Nada encontrado.",
  maisUsados: "Mais usados",
  expandirSubmenu: "Expandir sub-menu",
  recolherSubmenu: "Recolher sub-menu",
  contaSenha: "Conta & senha",
  irParaSite: "Ir para o site",
  notificacoes: "Notificações",
  irPara: "Ir para",
  nadaPendente: "Nada pendente por aqui.",
};

export type ShellNavConfig = {
  linkComponent?: ShellLinkComponent;
  pathname?: string;
  navigate?: (href: string) => void;
  textos?: Partial<ShellTextos>;
  uppercase?: boolean;
};

const ShellNavContext = createContext<ShellNavConfig>({});

export function ShellNavProvider({ children, ...config }: ShellNavConfig & { children: ReactNode }) {
  const parent = useContext(ShellNavContext);
  const { linkComponent, pathname, navigate, textos, uppercase } = config;
  const value = useMemo<ShellNavConfig>(
    () => ({
      linkComponent: linkComponent ?? parent.linkComponent,
      pathname: pathname ?? parent.pathname,
      navigate: navigate ?? parent.navigate,
      textos: { ...parent.textos, ...textos },
      uppercase: uppercase ?? parent.uppercase,
    }),
    [parent, linkComponent, pathname, navigate, textos, uppercase],
  );
  return <ShellNavContext.Provider value={value}>{children}</ShellNavContext.Provider>;
}

export function useShellNav() {
  const ctx = useContext(ShellNavContext);
  const nextPathname = usePathname();
  const router = useRouter();
  return {
    Link: (ctx.linkComponent ?? NextLink) as ShellLinkComponent,
    pathname: ctx.pathname ?? nextPathname ?? "",
    navigate: ctx.navigate ?? ((href: string) => router.push(href)),
    textos: { ...SHELL_TEXTOS_PT, ...ctx.textos } as ShellTextos,
    uppercase: ctx.uppercase ?? false,
  };
}

export function isActiveHref(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export function isItemActive(pathname: string, item: Pick<NavItem, "href" | "exact">): boolean {
  return item.exact ? pathname === item.href : isActiveHref(pathname, item.href);
}

export type NavItemChunk = { group?: string; items: NavItem[] };

export function chunkByGroup(items: NavItem[]): NavItemChunk[] {
  const out: NavItemChunk[] = [];
  for (const item of items) {
    const last = out[out.length - 1];
    if (last && last.group === item.group) last.items.push(item);
    else out.push({ group: item.group, items: [item] });
  }
  return out;
}
