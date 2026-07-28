/**
 * `sitekit` — motor visual dos SITES PÚBLICOS da plataforma (landing de
 * segmento, site do representante, josejunior.dev). Tudo aqui é **dado → CSS**:
 * o conteúdo diz *o quê*, o componente decide *como*. É o que permite a IA
 * montar página boa sem escrever layout, e o que impede ela de estragar a página.
 *
 * Regras: RSC-safe (sem `"use client"`, sem hooks, sem handlers) e
 * determinístico (sem `Math.random`/`Date.now`) — estes componentes rodam em
 * Server Component e no preview do editor.
 */
export { resolveSiteIcon, SITE_ICON_NAMES, type LucideIcon } from "./icons";
export {
  SITE_VIBES,
  SITE_VIBE_NAMES,
  resolveSiteTheme,
  brandGradient,
  darken,
  tint,
  type SiteVibe,
  type SiteTheme,
  type ResolvedSiteTheme,
} from "./theme";
export {
  DeviceMock,
  MOCK_KINDS,
  type MockSpec,
  type MockDevice,
  type MockKind,
  type MockRow,
  type MockKpi,
  type MockTranslate,
} from "./DeviceMock";
export {
  TrustStrip,
  DEFAULT_TRUST_SELF_SERVE,
  DEFAULT_TRUST_ATENDIMENTO,
  type TrustItem,
} from "./TrustStrip";
