/**
 * Escape hatches do Chakra — SÓ para telas PÚBLICAS (web landing, site público),
 * que podem variar e às vezes precisam de CSS livre.
 *
 *   ⛔ PROIBIDO em painel interno (`apps/site/src/app/(app)`, `apps/sistema`):
 *      lá a UI é UNA — use os componentes do ui (Button, FormInput/FormField/
 *      FormSelect, Tag/StatusBadge, Modal/SidePanel, Tabs, DataTable, Input do ui).
 *
 * Como em `primitives.ts`: `import ... as C` + `export const X = C` (atribuição
 * local), NÃO `export { X } from "@chakra-ui/react"` — o re-export direto quebra
 * o tree-shaking da anatomy do @ark-ui no build do Turbopack.
 */
import {
  Fieldset as CFieldset,
  Checkbox as CCheckbox,
  RadioGroup as CRadioGroup,
  Slider as CSlider,
  Editable as CEditable,
  Icon as CIcon,
  Table as CTable,
  Code as CCode,
  Kbd as CKbd,
  Skeleton as CSkeleton,
  SkeletonText as CSkeletonText,
  Stat as CStat,
  Portal as CPortal,
  Show as CShow,
  Float as CFloat,
  Bleed as CBleed,
  Avatar as CAvatar,
  Collapsible as CCollapsible,
  Progress as CProgress,
  List as CList,
  Breadcrumb as CBreadcrumb,
  CloseButton as CCloseButton,
  Group as CGroup,
  InputGroup as CInputGroup,
  Link as CLink,
  Button as CButton,
  Accordion as CAccordion,
  Tooltip as CTooltip,
  chakra as Cchakra,
} from "@chakra-ui/react";

export const Fieldset = CFieldset;
export const Checkbox = CCheckbox;
export const RadioGroup = CRadioGroup;
export const Slider = CSlider;
export const Editable = CEditable;
export const Icon = CIcon;
export const Table = CTable;
export const Code = CCode;
export const Kbd = CKbd;
export const Skeleton = CSkeleton;
export const SkeletonText = CSkeletonText;
export const Stat = CStat;
export const Portal = CPortal;
export const Show = CShow;
export const Float = CFloat;
export const Bleed = CBleed;
export const Avatar = CAvatar;
export const Collapsible = CCollapsible;
export const Progress = CProgress;
export const List = CList;
export const Breadcrumb = CBreadcrumb;
export const CloseButton = CCloseButton;
export const Group = CGroup;
export const InputGroup = CInputGroup;
/** Link cru do Chakra (anchor estilizado) p/ landing/público. */
export const ChakraLink = CLink;
/** Button cru do Chakra (full style-props) p/ landing/público (sem tons admin). */
export const ChakraButton = CButton;
export const ChakraAccordion = CAccordion;
export const ChakraTooltip = CTooltip;
/** factory de styled-components do Chakra (sem equivalente no ui). */
export const chakra = Cchakra;
