import type { ReactNode } from "react";
import { buildAdminTokensCss, type AdminPalette } from "./tokens";
import { ADMIN_FONTE_UNIVERSAL, ADMIN_STRUCTURAL_CSS } from "./structural-css";

export function AdminThemeShell({
  palette,
  fontsHref,
  children,
}: {
  palette: AdminPalette;
  fontsHref?: string;
  children: ReactNode;
}) {
  return (
    <>
      {fontsHref ? <link rel="stylesheet" href={fontsHref} /> : null}
      <style
        dangerouslySetInnerHTML={{
          __html:
            buildAdminTokensCss(palette) +
            (palette.fontesDoTema
              ? ADMIN_STRUCTURAL_CSS.replace(ADMIN_FONTE_UNIVERSAL, ".admin-shell { font-family: var(--admin-font-body); }")
              : ADMIN_STRUCTURAL_CSS),
        }}
      />
      <div className="admin-shell">{children}</div>
    </>
  );
}

/** Avatar com iniciais (header/topbar/login). `logoUrl` opcional usa imagem. */
export function AdminCrest({
  initials = "JJ",
  size = 40,
  logoUrl,
}: {
  initials?: string;
  size?: number;
  logoUrl?: string;
}) {
  const radius = Math.round(size / 4);
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: "cover",
          border: "1px solid var(--admin-accent-soft)",
        }}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background:
          "linear-gradient(135deg, var(--admin-primary) 0%, var(--admin-accent) 100%)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--admin-font-heading)",
        fontWeight: 700,
        fontSize: Math.round(size / 2.7),
        letterSpacing: 0.6,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

/** Logo da marca (imagem). Retorna null sem logoUrl (o caller usa o nome). */
export function AdminBrandLogo({
  logoUrl,
  brandName = "",
  height = 40,
  maxWidth = 200,
}: {
  logoUrl?: string;
  brandName?: string;
  height?: number;
  maxWidth?: number;
}) {
  if (!logoUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={brandName}
      style={{ height, width: "auto", maxWidth, objectFit: "contain", display: "block" }}
    />
  );
}

/** Helper p/ iniciais a partir de nome/email. */
export function initialsFrom(name?: string | null, email?: string | null): string {
  const base = (name ?? email ?? "U").trim();
  return base
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
