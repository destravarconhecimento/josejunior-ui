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
export { SidePanel } from "./components/SidePanel";
export { ConfirmDialog } from "./components/ConfirmDialog";
export { FilterBar, type SelectFilter } from "./components/FilterBar";
export { Tabs, type TabDef } from "./components/Tabs";
