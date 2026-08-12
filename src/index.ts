// Primitivos de layout (re-export fino do Chakra — apps importam daqui, nunca do Chakra)
export * from "./primitives";
// Controles DO design-system (componentes do ui, estilo --admin embutido)
export {
  Input, Textarea, IconButton, Field, NativeSelect, Switch, Badge,
  type InputProps, type TextareaProps, type IconButtonProps, type BadgeProps,
} from "./components/controls";
// Escape hatches do Chakra — SÓ para telas PÚBLICAS; proibido em painel (app)
export * from "./chakra-controls";

// Provider único de UI (next-themes + Chakra) + fábrica de system (cor do chamador)
export { UiProvider } from "./provider/UiProvider";
export { createUiSystem, getUiSystem, type UiSystem } from "./provider/system";

// Tema / shell visual
export {
  AdminThemeShell,
  AdminCrest,
  AdminBrandLogo,
  initialsFrom,
} from "./theme/AdminThemeShell";
export { buildAdminTokensCss, type AdminPalette } from "./theme/tokens";
export { ADMIN_STRUCTURAL_CSS } from "./theme/structural-css";

// Shell — `AppShell` (sidebar escura) ou `TopBarShell` (header horizontal)
export { AppShell } from "./shell/AppShell";
export { TopBarShell } from "./shell/TopBarShell";
export { TopNav } from "./shell/TopNav";
export { GroupRail } from "./shell/GroupRail";
export { NavSearch } from "./shell/NavSearch";
export { NavBadgeLink } from "./shell/NavBadgeLink";
export {
  NotificationBell,
  type NotificationItem,
  type NotificationTone,
} from "./shell/NotificationBell";
export { UserMenu } from "./shell/UserMenu";
export { MobileNav } from "./shell/MobileNav";
export { BottomNav } from "./shell/BottomNav";
export { ActiveLink, isActiveHref } from "./shell/ActiveLink";
export type { NavItem, NavSection, Brand, AppUser } from "./shell/types";

// Primitivos
// `Screen` = moldura única da tela (header + corpo). É o que as telas devem usar;
// `PageHeader`/`PageBody` seguem exportados pra composição fora do padrão (workspace).
export { Screen } from "./components/Screen";
export { PageHeader } from "./components/PageHeader";
export { PageBody } from "./components/PageBody";
export { ScrollArea } from "./components/ScrollArea";
export { Card } from "./components/Card";
export { Button, type ButtonTone } from "./components/Button";
export { Tag, StatusBadge, DeliveryBadge } from "./components/Badge";
export { LeadKindBadge, classifyLead, LEAD_KIND_META, type LeadKindKey } from "./components/LeadKind";
export { EmptyState } from "./components/EmptyState";
// Tempo real por INJEÇÃO (o ui não conhece transporte — ver components/realtime.ts)
export type { UiRealtimeEvent, UiRealtimeSubscribe } from "./components/realtime";
export { EmailHtmlView } from "./components/EmailHtmlView";
export {
  MailClient,
  DEFAULT_MAIL_CATEGORIES,
  type MailResult,
  type MailProvider,
  type MailConnEditor,
  type MailConnectionRow,
  type MailDnsRecord,
  type MailDomain,
  type MailDomainOption,
  type MailUserOption,
  type MailAccountRow,
  type MailInboxAccount,
  type MailAttachment,
  type MailMessage,
  type MailFolder,
  type MailAiSettings,
  type MailCallbacks,
} from "./components/email/MailClient";
export {
  WhatsAppInbox,
  type WaInboxApi,
  type WaInboxResult,
  type WaChat,
  type WaMessage,
  type WaMediaKind,
} from "./components/whatsapp/WhatsAppInbox";
export {
  WhatsAppClient,
  type WhatsAppClientProps,
  type WhatsAppResult,
  type WhatsAppSentBy,
  type WhatsAppVinculo,
  type WhatsAppVinculoLead,
  type WhatsAppVinculoTenant,
  type WhatsAppVinculoOption,
  type WhatsAppChat,
  type WhatsAppMessage,
  type WhatsAppStats,
  type WhatsAppConfigSlot,
  type WhatsAppCallbacks,
} from "./components/whatsapp/WhatsAppClient";
export {
  WhatsAppFab,
  abrirWhatsAppFab,
  WA_FAB_OPEN_CHAT_EVENT,
  WA_FAB_SENT_EVENT,
  type WhatsAppFabOpenChat,
  type WhatsAppFabSent,
  type WhatsAppFabProps,
  type WhatsAppFabCallbacks,
} from "./components/whatsapp/WhatsAppFab";
export {
  ConexaoWhatsApp,
  type ConexaoWhatsAppProps,
  type ConexaoWhatsAppPairResult,
  type ConexaoWhatsAppModo,
} from "./components/whatsapp/ConexaoWhatsApp";
export {
  ConexaoPlugin,
  type ConexaoPluginProps,
  type PluginConfigView,
  type PluginDeviceView,
  type PluginFilaView,
  type PluginCodigo,
} from "./components/whatsapp/ConexaoPlugin";
export {
  ContasWhatsApp,
  type ContasWhatsAppProps,
  type WaContaModo,
  type WaContaView,
  type WaContaAcao,
  type WaPedidoStatus,
  type WaPedidoView,
} from "./components/whatsapp/ContasWhatsApp";
export {
  GoogleCredentialForm,
  type GoogleCredentialSaveResult,
  type GoogleRedirectUri,
} from "./components/GoogleCredentialForm";
export { FormField, FormGrid, FormActions, FormColor, FormInput, FormSelect, FormTextarea } from "./components/form";
export { DataTable, TableCard, type Column } from "./components/DataTable";
export { Pagination } from "./components/Pagination";
export { Modal } from "./components/Modal";
export { ImageCropper } from "./components/ImageCropper";
export { CrudManager } from "./components/CrudManager";
export {
  EvolucoesManager,
  type EvolucoesManagerProps,
  type EvolucaoItem,
  type EvolucaoSaveData,
} from "./components/EvolucoesManager";
export { Toaster, toaster, toast } from "./components/Toast";
export { Accordion, type AccordionItemDef } from "./components/Accordion";
export { SidePanel } from "./components/SidePanel";
export { ConfirmDialog } from "./components/ConfirmDialog";
export { useConfirm } from "./components/useConfirm";
export { FilterBar, type SelectFilter } from "./components/FilterBar";
export { rowMatchesQuery } from "./search";
export { InlineSelect, type InlineSelectOption } from "./components/InlineSelect";
export { SearchSelect, type SearchSelectOption } from "./components/SearchSelect";
export { MonthPicker } from "./components/MonthPicker";
export { AccountSelector, type AccountSelectorOption } from "./components/AccountSelector";
export { ActionMenu, type ActionMenuItem } from "./components/ActionMenu";
export { LocaleSelector, type LocaleOption } from "./components/LocaleSelector";
export { FlagIcon } from "./components/FlagIcon";
export {
  TranslationsSection,
  type TranslationsSectionProps,
  type TranslationsPayload,
  type TranslationsLocale,
  type TranslationsField,
  type TranslationsEntry,
  type TranslationsActionResult,
} from "./components/TranslationsSection";
export { RepSiteSectionsEditor, REPSITE_I18N_LABELS, type RepSiteSectionsEditorProps } from "./components/RepSiteSectionsEditor";
// Editor "Meu site" (josejunior.dev) — componente PURO (molde MailClient): todas
// as seções + o módulo de rastreamento vivem aqui; o app injeta actions e o slot
// de upload. Ver components/site-editor/.
export {
  SiteIdentityEditor,
  type SiteIdentityEditorProps,
  type SiteIdentityCallbacks,
} from "./components/site-editor/SiteIdentityEditor";
export {
  type SiteIdentityContent,
  type SiteMarketing,
  type SiteSaveResult,
  type SiteImageUploadSlot,
  type SiteProjectStatus,
  type SiteSocialKind,
  type SiteIconItem,
  type SiteStepItem,
  type SiteProjectItem,
  type SiteTimelineItem,
  type SiteTestimonialItem,
  type SiteHighlightItem,
  type SiteContactInfoItem,
  type SiteSkillItem,
  type SiteSocialItem,
  type SiteStatItem,
  type SiteThemeContent,
} from "./components/site-editor/types";
export { SITE_ICON_OPTIONS, SITE_ICON_VALUES, type SiteIconOption } from "./components/site-editor/icon-options";
// Ícone de MARCA do WhatsApp (o lucide só tem `MessageCircle` genérico). Vem do
// pacote `react-icons` (Font Awesome 6) — nada de SVG à mão. Fonte única: os
// FABs e os botões flutuantes importam ESTE, não o react-icons direto.
export { FaWhatsapp as WhatsAppIcon } from "react-icons/fa6";
export { ColorPicker, type ColorScheme } from "./components/ColorPicker";
export { Tabs, type TabDef } from "./components/Tabs";
export { PanelTabs } from "./components/PanelTabs";
export { PageTabs } from "./components/PageTabs";
export { ChatMarkdown } from "./components/ChatMarkdown";
export { AiAssistantFab } from "./components/AiAssistantFab";
// Console do assistente (chat em tela cheia) — divide o miolo com o FAB.
export { AiAssistantConsole, type AiConsoleSuggestion } from "./components/ai/AiAssistantConsole";
export { useAiChat, type AiChatMsg } from "./components/ai/useAiChat";

// Primitivos premium (KPIs, avatar, IA, timeline, ações rápidas)
export { KpiCard, type KpiTone, type KpiTrendTone } from "./components/KpiCard";
export { ProgressBar, type ProgressTone } from "./components/ProgressBar";
export {
  EntityAvatar,
  type EntityAvatarSize,
  type EntityAvatarStatus,
} from "./components/EntityAvatar";
export { UserAvatar } from "./components/UserAvatar";
export {
  AVATAR_SCHEMES,
  type AvatarScheme,
  resolveAvatarScheme,
  isAvatarSchemeId,
} from "./components/avatarSchemes";
export { InsightCard, type InsightTone } from "./components/InsightCard";
export { Timeline, type TimelineItem, type TimelineTone } from "./components/Timeline";
export {
  QuickActionGrid,
  type QuickAction,
  type QuickActionTone,
} from "./components/QuickActionGrid";
export { DonutChart, type DonutItem } from "./components/DonutChart";
export { LineChart, type LineSeries } from "./components/LineChart";

// Central Operacional (status, fila, funil, atendimento, ações)
export {
  IntegrationStatusRow,
  IntegrationStatusCard,
  type IntegrationStatusItem,
  type IntegrationTone,
} from "./components/IntegrationStatusRow";
export {
  OperationalQueue,
  type OperationalQueueItem,
  type QueuePriority,
} from "./components/OperationalQueue";
export { ProcessFunnelCard, type FunnelStage } from "./components/ProcessFunnelCard";
export { FunnelStagesBar, type FunnelBarStage } from "./components/FunnelStagesBar";
export {
  ConversationSnapshotList,
  type ConversationSnapshotItem,
  type ConversationStatusTone,
} from "./components/ConversationSnapshotCard";
export { ActionListCard, type ActionListItem, type ActionTone } from "./components/ActionListCard";
export { RecentSalesList, type RecentSaleItem, type CoinSaleStatus } from "./components/RecentSalesList";

// sitekit — motor visual dos SITES PÚBLICOS (segmento, representante, meu site):
// tema por `vibe`, ícone por NOME, mockup de produto em CSS, faixa de confiança.
// Tudo dado → CSS, RSC-safe. Ver packages/ui/src/sitekit/index.ts.
export {
  resolveSiteIcon,
  SITE_ICON_NAMES,
  SITE_VIBES,
  SITE_VIBE_NAMES,
  resolveSiteTheme,
  brandGradient,
  darken,
  tint,
  DeviceMock,
  MOCK_KINDS,
  TrustStrip,
  DEFAULT_TRUST_SELF_SERVE,
  DEFAULT_TRUST_ATENDIMENTO,
  type LucideIcon,
  type SiteVibe,
  type SiteTheme,
  type ResolvedSiteTheme,
  type MockSpec,
  type MockDevice,
  type MockKind,
  type MockRow,
  type MockKpi,
  type MockTranslate,
  type TrustItem,
} from "./sitekit";

// Editor de Flyers (canvas puro + editor client + galeria) — apps/site
export { SlidePage, type SlidePageProps, type SlideMode } from "./flyer/SlidePage";
export { FlyerEditor, type FlyerEditorProps, type FlyerSaveData } from "./flyer/FlyerEditor";
export type { FlyerComparison } from "./flyer/types";
export { FlyersGallery, type FlyersGalleryProps } from "./flyer/FlyersGallery";
export { FlyerPublicView, type FlyerPublicViewProps } from "./flyer/FlyerPublicView";
export {
  CANVAS_W as FLYER_CANVAS_W,
  CANVAS_H as FLYER_CANVAS_H,
  GOLD_GRADIENT,
  GOLD_SOLID,
  FLYER_FONTS,
  FONT_WEIGHTS,
  FLYER_DOC_VERSION,
} from "./flyer/constants";
export {
  flyerId,
  createTextElement,
  createImageElement,
  createShapeElement,
  blankPage,
  seedFlyerDocument,
  cloneElementShifted,
} from "./flyer/seed";
export type {
  FlyerBackground,
  FlyerTextElement,
  FlyerImageElement,
  FlyerShapeElement,
  FlyerElement,
  FlyerPage,
  FlyerDocument,
  FlyerBrand,
  FlyerSummary,
} from "./flyer/types";

// Gerador de Avatares (canvas puro + estúdio + galeria + padrão da agência) — apps/site
export { AvatarStudio, type AvatarStudioProps, type AvatarEditData } from "./avatar/AvatarStudio";
export { AvatarGallery, type AvatarGalleryProps } from "./avatar/AvatarGallery";
export { AvatarStudioPanel, type AvatarStudioPanelProps } from "./avatar/AvatarStudioPanel";
export { AvatarSettingsPanel, type AvatarSettingsPanelProps } from "./avatar/AvatarSettingsPanel";
export { AvatarCanvas, type AvatarCanvasProps } from "./avatar/AvatarCanvas";
export {
  composeAvatar,
  drawAvatarScene,
  ensureAvatarFont,
  loadAvatarImage,
  type AvatarScene,
} from "./avatar/compose";
export {
  AVATAR_SIZES,
  AVATAR_RENDER_SIZE,
  AVATAR_FONTS,
  AVATAR_FRAME_PRESETS,
  AVATAR_LAYOUT,
  AVATAR_COLORS,
  DEFAULT_AVATAR_SETTINGS,
  avatarFontWeight,
  avatarFontsHref,
  defaultAvatarConfig,
  avatarPresets,
  recipeOf,
  resolveAvatarPreset,
  bgSpreadOf,
  withBgSpread,
  type AvatarFont,
} from "./avatar/constants";
export type {
  AvatarSize,
  AvatarRing,
  AvatarFramePreset,
  AvatarFrameChoice,
  AvatarBackground,
  AvatarBackgroundSpread,
  AvatarPhotoTransform,
  AvatarLogoCorner,
  AvatarConfig,
  AvatarSummary,
  AvatarRecipe,
  AvatarPreset,
  AvatarSettings,
  AvatarBrand,
  AvatarMember,
  AvatarSaveData,
  AvatarActionResult,
  AvatarUploadKind,
} from "./avatar/types";
