"use client";

import { useState, type ReactNode } from "react";
import { PageHeader } from "./PageHeader";
import { Tabs, type TabDef } from "./Tabs";

/**
 * Tela com ABAS no padrão único: PageHeader (título + ações) com a barra de
 * abas no slot do header, e o painel ativo renderizado abaixo. Os painéis
 * chegam prontos (podem vir do server) — este wrapper só controla qual mostrar.
 */
export function PageTabs({
  title,
  actions,
  items,
  panels,
  defaultValue,
}: {
  title: string;
  actions?: ReactNode;
  items: TabDef[];
  panels: Record<string, ReactNode>;
  defaultValue?: string;
}) {
  const [tab, setTab] = useState(defaultValue ?? items[0]?.value ?? "");
  return (
    <>
      <PageHeader title={title} actions={actions} tabs={<Tabs value={tab} onChange={setTab} items={items} />} />
      {panels[tab] ?? null}
    </>
  );
}
