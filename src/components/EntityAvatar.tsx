import { Box } from "@chakra-ui/react";
import { initialsFrom } from "../theme/AdminThemeShell";

export type EntityAvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type EntityAvatarStatus = "online" | "offline" | "busy" | "none";

const SIZES: Record<EntityAvatarSize, { box: string; font: string; dot: string }> = {
  xs: { box: "28px", font: "11px", dot: "8px" },
  sm: { box: "34px", font: "13px", dot: "9px" },
  md: { box: "42px", font: "15px", dot: "11px" },
  lg: { box: "56px", font: "19px", dot: "13px" },
  xl: { box: "72px", font: "24px", dot: "15px" },
};

const STATUS_COLOR: Record<EntityAvatarStatus, string> = {
  online: "#22c55e",
  busy: "#ef4444",
  offline: "#94a3b8",
  none: "transparent",
};

// Paleta determinística a partir do nome (cor estável por pessoa).
const PALETTE = [
  { bg: "rgba(124,110,224,0.16)", fg: "#6d28d9" },
  { bg: "rgba(202,138,4,0.16)", fg: "#b45309" },
  { bg: "rgba(34,197,94,0.16)", fg: "#15803d" },
  { bg: "rgba(14,165,233,0.16)", fg: "#0369a1" },
  { bg: "rgba(236,72,153,0.16)", fg: "#be185d" },
  { bg: "rgba(245,158,11,0.16)", fg: "#b45309" },
];

function toneFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** Avatar de entidade: imagem ou iniciais com cor estável por nome, + status. */
export function EntityAvatar({
  name,
  src,
  size = "md",
  status = "none",
}: {
  name: string;
  src?: string | null;
  size?: EntityAvatarSize;
  status?: EntityAvatarStatus;
}) {
  const s = SIZES[size];
  const tone = toneFor(name || "?");
  return (
    <Box position="relative" flexShrink={0} w={s.box} h={s.box}>
      <Box
        w={s.box}
        h={s.box}
        borderRadius="full"
        bg={src ? "var(--admin-surface-2)" : tone.bg}
        color={tone.fg}
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize={s.font}
        fontWeight="700"
        overflow="hidden"
        backgroundImage={src ? `url(${src})` : undefined}
        backgroundSize="cover"
        backgroundPosition="center"
      >
        {src ? null : initialsFrom(name || "?")}
      </Box>
      {status !== "none" ? (
        <Box
          position="absolute"
          bottom="0"
          right="0"
          w={s.dot}
          h={s.dot}
          borderRadius="full"
          bg={STATUS_COLOR[status]}
          border="2px solid var(--admin-surface)"
        />
      ) : null}
    </Box>
  );
}
