"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useShellNav } from "../shell/ShellNav";

export function LinkDaUi({
  href,
  children,
  ...rest
}: { href: string; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const { Link } = useShellNav();
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}

export function useNavegar(): (href: string) => void {
  return useShellNav().navigate;
}
