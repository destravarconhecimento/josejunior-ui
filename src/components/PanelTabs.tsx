"use client";

import { Tabs as CTabs } from "@chakra-ui/react";

/**
 * Abas COMPOSTAS do design-system (Root/List/Trigger/Content) — para telas com
 * abas customizadas (ex.: sidebar com reordenar) que o `Tabs` controlado não
 * cobre. É componente DO ui (estilo `--admin` embutido no Trigger), não Chakra
 * cru. Para abas simples, prefira o `Tabs` controlado (value/onChange/items).
 */
function Root(props: React.ComponentProps<typeof CTabs.Root>) {
  return <CTabs.Root {...props} />;
}

function Trigger(props: React.ComponentProps<typeof CTabs.Trigger>) {
  return (
    <CTabs.Trigger
      color="var(--admin-text-soft)"
      fontWeight="600"
      _selected={{
        color: "var(--admin-primary)",
        borderColor: "var(--admin-primary)",
        bg: "var(--admin-nav-active)",
      }}
      _hover={{ color: "var(--admin-primary)" }}
      {...props}
    />
  );
}

export const PanelTabs = {
  Root,
  List: CTabs.List,
  Trigger,
  Content: CTabs.Content,
  Indicator: CTabs.Indicator,
};
