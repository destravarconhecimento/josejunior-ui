/**
 * Esquemas de cor "cara pintada" para a LETRA do avatar de iniciais.
 * Reusa a paleta das molduras do Gerador de Avatares (rasta/rajada/ouro/neon) e
 * estende com combinações no mesmo espírito. PURO — sem React, seguro em
 * server + client. O `id` é o valor guardado em `users.color` NO LUGAR de um hex:
 * quando `color` é um id daqui, a inicial vira um degradê (e o anel do avatar
 * acompanha); qualquer outro valor continua sendo tratado como cor sólida.
 */
export type AvatarScheme = {
  id: string;
  label: string;
  /** Degradê CSS aplicado à LETRA (via background-clip:text). */
  gradient: string;
  /** Degradê do ANEL ao redor do avatar (UserAvatar). */
  ring: string;
  /** Cor sólida representativa — tom do fundo do avatar e cor do perfil no popover. */
  accent: string;
};

export const AVATAR_SCHEMES: readonly AvatarScheme[] = [
  {
    id: "rasta",
    label: "Rasta",
    gradient: "linear-gradient(135deg, #149a4b 0%, #16a34a 24%, #f2c500 56%, #e0311d 100%)",
    ring: "conic-gradient(from 210deg, #149a4b, #f2c500, #e0311d, #149a4b)",
    accent: "#149a4b",
  },
  {
    id: "rajada",
    label: "Rajada",
    gradient: "linear-gradient(135deg, #e0311d, #f2c500 28%, #149a4b 52%, #2563eb 76%, #7c3aed)",
    ring: "conic-gradient(from 0deg, #e0311d, #f2c500, #149a4b, #2563eb, #7c3aed, #e0311d)",
    accent: "#7c3aed",
  },
  {
    id: "ouro",
    label: "Ouro",
    gradient: "linear-gradient(135deg, #a16207, #e8c25a 38%, #fff4c4 55%, #e8c25a 72%, #a16207)",
    ring: "conic-gradient(from 200deg, #a16207, #e8c25a, #fff4c4, #e8c25a, #a16207)",
    accent: "#c69749",
  },
  {
    id: "neon",
    label: "Neon",
    gradient: "linear-gradient(135deg, #39ff14, #22c55e 52%, #14b8a6)",
    ring: "conic-gradient(from 180deg, #39ff14, #14b8a6, #39ff14)",
    accent: "#22c55e",
  },
  {
    id: "fogo",
    label: "Fogo",
    gradient: "linear-gradient(135deg, #f59e0b, #f97316 44%, #ef4444 80%, #b91c1c)",
    ring: "conic-gradient(from 200deg, #f59e0b, #f97316, #ef4444, #f59e0b)",
    accent: "#f97316",
  },
  {
    id: "oceano",
    label: "Oceano",
    gradient: "linear-gradient(135deg, #06b6d4, #0ea5e9 40%, #3b82f6 70%, #6366f1)",
    ring: "conic-gradient(from 200deg, #06b6d4, #3b82f6, #6366f1, #06b6d4)",
    accent: "#0ea5e9",
  },
] as const;

const BY_ID = new Map(AVATAR_SCHEMES.map((s) => [s.id, s] as const));

/** Retorna o esquema quando `value` é um id conhecido; senão `null` (é um hex). */
export function resolveAvatarScheme(value?: string | null): AvatarScheme | null {
  if (!value) return null;
  return BY_ID.get(value.trim().toLowerCase()) ?? null;
}

/** `true` se `value` for o id de um esquema (usado pra validar no servidor). */
export function isAvatarSchemeId(value?: string | null): boolean {
  return !!value && BY_ID.has(value.trim().toLowerCase());
}
