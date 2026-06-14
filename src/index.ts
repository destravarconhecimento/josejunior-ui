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
export { ActiveLink, isActiveHref } from "./shell/ActiveLink";
export type { NavItem, NavSection, Brand, AppUser } from "./shell/types";

// Primitivos
export { PageHeader } from "./components/PageHeader";
export { PageBody } from "./components/PageBody";
export { Card } from "./components/Card";
export { Button, type ButtonTone } from "./components/Button";
export { Tag, StatusBadge, DeliveryBadge } from "./components/Badge";
export { EmptyState } from "./components/EmptyState";
export { FormField, FormGrid, FormActions, FormInput, FormSelect, FormTextarea } from "./components/form";
export { DataTable, TableCard, type Column } from "./components/DataTable";
export { Modal } from "./components/Modal";
export { Accordion, type AccordionItemDef } from "./components/Accordion";
export { SidePanel } from "./components/SidePanel";
export { ConfirmDialog } from "./components/ConfirmDialog";
export { useConfirm } from "./components/useConfirm";
export { FilterBar, type SelectFilter } from "./components/FilterBar";
export { Tabs, type TabDef } from "./components/Tabs";
export { PageTabs } from "./components/PageTabs";
export { ChatMarkdown } from "./components/ChatMarkdown";

// Primitivos premium (KPIs, avatar, IA, timeline, ações rápidas)
export { KpiCard, type KpiTone, type KpiTrendTone } from "./components/KpiCard";
export {
  EntityAvatar,
  type EntityAvatarSize,
  type EntityAvatarStatus,
} from "./components/EntityAvatar";
export { InsightCard, type InsightTone } from "./components/InsightCard";
export { Timeline, type TimelineItem, type TimelineTone } from "./components/Timeline";
export {
  QuickActionGrid,
  type QuickAction,
  type QuickActionTone,
} from "./components/QuickActionGrid";
export { DonutChart, type DonutItem } from "./components/DonutChart";
export { LineChart, type LineSeries } from "./components/LineChart";
