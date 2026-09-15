"use client";

import type { ReactNode } from "react";
import { Box, HStack } from "@chakra-ui/react";
import { Tabs, type TabDef } from "./Tabs";

export function LayoutDeAbas({
  abas,
  aba,
  onAba,
  rotuloSidebar,
  children,
  fill = false,
}: {
  abas: TabDef[];
  aba: string;
  onAba: (value: string) => void;
  rotuloSidebar: string;
  children: ReactNode;
  fill?: boolean;
}) {
  return (
    <HStack
      align="flex-start"
      gap={{ base: 4, md: 6 }}
      flexDirection={{ base: "column", md: "row" }}
      flex={fill ? "1" : undefined}
      minH={fill ? 0 : undefined}
      w="full"
    >
      <Tabs orientation="vertical" value={aba} onChange={onAba} sidebarLabel={rotuloSidebar} items={abas} />
      <Box flex="1" minW={0} minH={fill ? 0 : undefined} w="full">
        {children}
      </Box>
    </HStack>
  );
}
