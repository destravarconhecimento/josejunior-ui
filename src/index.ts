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

// Shell (top bar)
export { AppShell } from "./shell/AppShell";
export { TopNav } from "./shell/TopNav";
export { UserMenu } from "./shell/UserMenu";
export { MobileNav } from "./shell/MobileNav";
export { BottomNav } from "./shell/BottomNav";
export { ActiveLink, isActiveHref } from "./shell/ActiveLink";
export type { NavItem, NavSection, Brand, AppUser } from "./shell/types";

// Primitivos
export { PageHeader } from "./components/PageHeader";
export { PageBody } from "./components/PageBody";
export { Card } from "./components/Card";
export { Button, type ButtonTone } from "./components/Button";
export { Tag, StatusBadge, DeliveryBadge } from "./components/Badge";
export { EmptyState } from "./components/EmptyState";
export { EmailHtmlView } from "./components/EmailHtmlView";
export {
  MailClient,
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
  type MailCallbacks,
} from "./components/email/MailClient";
export {
  GoogleCredentialForm,
  type GoogleCredentialSaveResult,
  type GoogleRedirectUri,
} from "./components/GoogleCredentialForm";
export { FormField, FormGrid, FormActions, FormInput, FormSelect, FormTextarea } from "./components/form";
export { DataTable, TableCard, type Column } from "./components/DataTable";
export { Pagination } from "./components/Pagination";
export { Modal } from "./components/Modal";
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
export { InlineSelect, type InlineSelectOption } from "./components/InlineSelect";
export { MonthPicker } from "./components/MonthPicker";
export { ActionMenu, type ActionMenuItem } from "./components/ActionMenu";
export { ColorPicker } from "./components/ColorPicker";
export { Tabs, type TabDef } from "./components/Tabs";
export { PanelTabs } from "./components/PanelTabs";
export { PageTabs } from "./components/PageTabs";
export { ChatMarkdown } from "./components/ChatMarkdown";
export { AiAssistantFab } from "./components/AiAssistantFab";

// Primitivos premium (KPIs, avatar, IA, timeline, ações rápidas)
export { KpiCard, type KpiTone, type KpiTrendTone } from "./components/KpiCard";
export { ProgressBar, type ProgressTone } from "./components/ProgressBar";
export {
  EntityAvatar,
  type EntityAvatarSize,
  type EntityAvatarStatus,
} from "./components/EntityAvatar";
export { UserAvatar } from "./components/UserAvatar";
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
export {
  ConversationSnapshotList,
  type ConversationSnapshotItem,
  type ConversationStatusTone,
} from "./components/ConversationSnapshotCard";
export { ActionListCard, type ActionListItem, type ActionTone } from "./components/ActionListCard";
export { RecentSalesList, type RecentSaleItem, type CoinSaleStatus } from "./components/RecentSalesList";

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
  type AvatarFont,
} from "./avatar/constants";
export type {
  AvatarSize,
  AvatarRing,
  AvatarFramePreset,
  AvatarFrameChoice,
  AvatarBackground,
  AvatarPhotoTransform,
  AvatarLogoCorner,
  AvatarConfig,
  AvatarSummary,
  AvatarSettings,
  AvatarBrand,
  AvatarMember,
  AvatarSaveData,
  AvatarActionResult,
  AvatarUploadKind,
} from "./avatar/types";
