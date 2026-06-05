import type { ReactNode } from "react";
import { Box, Table } from "@chakra-ui/react";
import { EmptyState } from "./EmptyState";

export type Column<T> = {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  align?: "start" | "center" | "end";
  width?: string;
};

/** Container de tabela (card + scroll horizontal) p/ tabelas custom. */
export function TableCard({ children }: { children: ReactNode }) {
  return (
    <Box className="admin-card" overflowX="auto">
      {children}
    </Box>
  );
}

/** Tabela padrão por colunas+linhas. Usa `render` p/ células custom. */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  empty,
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string | number;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
}) {
  if (rows.length === 0) {
    return (
      <Box className="admin-card">
        {empty ?? <EmptyState title="Nada por aqui ainda." />}
      </Box>
    );
  }
  return (
    <TableCard>
      <Table.Root size="md">
        <Table.Header>
          <Table.Row>
            {columns.map((c) => (
              <Table.ColumnHeader key={c.key} textAlign={c.align} width={c.width}>
                {c.header}
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((row, i) => (
            <Table.Row
              key={getRowKey(row, i)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              cursor={onRowClick ? "pointer" : undefined}
              _hover={onRowClick ? { bg: "var(--admin-nav-hover)" } : undefined}
            >
              {columns.map((c) => (
                <Table.Cell key={c.key} textAlign={c.align}>
                  {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </TableCard>
  );
}
