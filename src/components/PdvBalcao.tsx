"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Box, HStack, Input, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "./Button";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";

/**
 * Balcão (PDV por toque): grade de produtos à esquerda (chips de categoria +
 * busca), carrinho à direita (qtd −/+, total, "Cobrar"). Componente PURO:
 * dados e callbacks por props, IDs string; a cobrança (forma de pagamento,
 * troco) fica com o app, num Modal. Feito pra tablet/celular na bancada:
 * tiles grandes, um toque adiciona.
 */

export type PdvProduto = {
  id: string;
  nome: string;
  precoCents: number;
  categoriaId: string | null;
  /** Estoque controlado: `null` = não controla. Zero ou negativo = avisa (mas ainda vende). */
  estoque: number | null;
  imagemUrl?: string | null;
};
export type PdvCategoria = { id: string; nome: string; cor?: string | null };
export type PdvItemCarrinho = { produtoId: string; nome: string; precoCents: number; quantidade: number };

export const fmtBRL = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CHIP_COLORS = ["#7c6ee0", "#0ea5e9", "#f97316", "#22c55e", "#ec4899", "#eab308", "#14b8a6", "#8b5cf6"];

export function PdvBalcao({
  produtos,
  categorias,
  carrinho,
  onAdd,
  onRemove,
  onSetQuantidade,
  onLimpar,
  onCobrar,
  cobrando = false,
  bloqueado,
  rodape,
}: {
  produtos: PdvProduto[];
  categorias: PdvCategoria[];
  carrinho: PdvItemCarrinho[];
  onAdd: (produtoId: string) => void;
  onRemove: (produtoId: string) => void;
  onSetQuantidade: (produtoId: string, quantidade: number) => void;
  onLimpar: () => void;
  onCobrar: () => void;
  cobrando?: boolean;
  /** Mensagem que trava a venda (ex.: caixa fechado). Some o botão "Cobrar". */
  bloqueado?: ReactNode;
  /** Linha extra no rodapé do carrinho (ex.: resumo do caixa). */
  rodape?: ReactNode;
}) {
  const [cat, setCat] = useState<string>("");
  const [busca, setBusca] = useState("");

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return produtos.filter((p) => (!cat || p.categoriaId === cat) && (!q || p.nome.toLowerCase().includes(q)));
  }, [produtos, cat, busca]);

  const total = carrinho.reduce((s, i) => s + i.precoCents * i.quantidade, 0);
  const unidades = carrinho.reduce((s, i) => s + i.quantidade, 0);
  const corDe = (c: PdvCategoria, i: number) => c.cor || CHIP_COLORS[i % CHIP_COLORS.length];

  return (
    <Box display="grid" gridTemplateColumns={{ base: "1fr", lg: "minmax(0,1fr) 360px" }} gap={4} alignItems="start">
      {/* ── Produtos ── */}
      <Stack gap={3} minW={0}>
        <HStack gap={2} flexWrap="wrap">
          <Chip ativo={!cat} cor="var(--admin-primary)" onClick={() => setCat("")}>
            Tudo
          </Chip>
          {categorias.map((c, i) => (
            <Chip key={c.id} ativo={cat === c.id} cor={corDe(c, i)} onClick={() => setCat(cat === c.id ? "" : c.id)}>
              {c.nome}
            </Chip>
          ))}
          <Box flex="1" minW="160px" position="relative">
            <Box position="absolute" left="10px" top="50%" transform="translateY(-50%)" color="var(--admin-text-soft)" pointerEvents="none">
              <Search size={15} />
            </Box>
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto…" bg="var(--admin-surface)" pl="32px" size="sm" borderRadius="10px" />
          </Box>
        </HStack>

        {visiveis.length === 0 ? (
          <Card>
            <EmptyState
              icon={ShoppingCart}
              title={produtos.length === 0 ? "Nenhum produto cadastrado" : "Nada encontrado"}
              description={produtos.length === 0 ? "Cadastre o cardápio em Produtos — cada produto vira um botão aqui." : "Tente outra busca ou categoria."}
            />
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 2, sm: 3, md: 4, xl: 5 }} gap={2.5}>
            {visiveis.map((p) => {
              const ci = categorias.findIndex((c) => c.id === p.categoriaId);
              const cor = ci >= 0 ? corDe(categorias[ci], ci) : "var(--admin-primary)";
              const esgotado = p.estoque != null && p.estoque <= 0;
              const noCarrinho = carrinho.find((i) => i.produtoId === p.id)?.quantidade ?? 0;
              return (
                <Box
                  key={p.id}
                  as="button"
                 
                  onClick={() => onAdd(p.id)}
                  position="relative"
                  display="flex"
                  flexDir="column"
                  justifyContent="space-between"
                  textAlign="left"
                  minH="96px"
                  p={3}
                  borderRadius="14px"
                  border="1px solid var(--admin-border)"
                  borderLeft={`4px solid ${cor}`}
                  bg="var(--admin-surface)"
                  cursor="pointer"
                  transition="transform .1s ease, border-color .12s ease, box-shadow .12s ease"
                  _hover={{ transform: "translateY(-2px)", borderColor: cor, boxShadow: "var(--admin-card-shadow)" }}
                  _active={{ transform: "scale(.97)" }}
                  opacity={esgotado ? 0.75 : 1}
                >
                  {noCarrinho > 0 ? (
                    <Box position="absolute" top="6px" right="6px" minW="22px" h="22px" px={1.5} borderRadius="full" bg="var(--admin-primary)" color="white" fontSize="xs" fontWeight="700" display="flex" alignItems="center" justifyContent="center">
                      {noCarrinho}
                    </Box>
                  ) : null}
                  <Text fontSize="sm" fontWeight="600" color="var(--admin-text)" lineClamp={2} pr={noCarrinho > 0 ? 6 : 0}>
                    {p.nome}
                  </Text>
                  <HStack justify="space-between" align="end" mt={2}>
                    <Text fontSize="md" fontWeight="700" color={cor}>
                      {fmtBRL(p.precoCents)}
                    </Text>
                    {p.estoque != null ? (
                      <Text fontSize="10px" fontWeight="600" color={esgotado ? "#b91c1c" : "var(--admin-text-soft)"}>
                        {esgotado ? "esgotado" : `${p.estoque} un`}
                      </Text>
                    ) : null}
                  </HStack>
                </Box>
              );
            })}
          </SimpleGrid>
        )}
      </Stack>

      {/* ── Carrinho ── */}
      <Box position={{ base: "static", lg: "sticky" }} top="calc(var(--admin-sticky-top, 0px) + 12px)">
        <Card
          title={
            <HStack gap={2}>
              <ShoppingCart size={16} />
              <span>Venda atual</span>
              {unidades > 0 ? (
                <Text as="span" fontSize="xs" color="var(--admin-text-soft)" fontWeight="500">
                  {unidades} item{unidades > 1 ? "s" : ""}
                </Text>
              ) : null}
            </HStack>
          }
          actions={
            carrinho.length ? (
              <Button tone="ghost" size="xs" onClick={onLimpar} title="Limpar a venda">
                <Trash2 size={14} /> Limpar
              </Button>
            ) : undefined
          }
        >
          <Stack gap={2}>
            {carrinho.length === 0 ? (
              <Text fontSize="sm" color="var(--admin-text-soft)" py={4} textAlign="center">
                Toque nos produtos para adicionar.
              </Text>
            ) : (
              carrinho.map((i) => (
                <HStack key={i.produtoId} gap={2} align="center" py={1.5} borderBottom="1px solid var(--admin-divider)">
                  <Box flex="1" minW={0}>
                    <Text fontSize="sm" fontWeight="600" color="var(--admin-text)" lineClamp={1}>
                      {i.nome}
                    </Text>
                    <Text fontSize="xs" color="var(--admin-text-soft)">
                      {fmtBRL(i.precoCents)} × {i.quantidade}
                    </Text>
                  </Box>
                  <HStack gap={0} border="1px solid var(--admin-border)" borderRadius="10px" overflow="hidden">
                    <QtyBtn onClick={() => (i.quantidade <= 1 ? onRemove(i.produtoId) : onSetQuantidade(i.produtoId, i.quantidade - 1))} aria-label="Menos um">
                      <Minus size={14} />
                    </QtyBtn>
                    <Text minW="28px" textAlign="center" fontSize="sm" fontWeight="700">
                      {i.quantidade}
                    </Text>
                    <QtyBtn onClick={() => onSetQuantidade(i.produtoId, i.quantidade + 1)} aria-label="Mais um">
                      <Plus size={14} />
                    </QtyBtn>
                  </HStack>
                  <Text minW="72px" textAlign="right" fontSize="sm" fontWeight="700" color="var(--admin-text)">
                    {fmtBRL(i.precoCents * i.quantidade)}
                  </Text>
                </HStack>
              ))
            )}

            <HStack justify="space-between" align="baseline" pt={2}>
              <Text fontSize="sm" color="var(--admin-text-soft)" fontWeight="600">
                Total
              </Text>
              <Text fontSize="2xl" fontWeight="800" color="var(--admin-text)" fontFamily="var(--admin-font-heading)">
                {fmtBRL(total)}
              </Text>
            </HStack>

            {bloqueado ? (
              <Box fontSize="sm" color="#a16207" bg="rgba(234,179,8,0.14)" borderRadius="10px" p={3}>
                {bloqueado}
              </Box>
            ) : (
              <Button tone="primary" size="lg" w="100%" onClick={onCobrar} disabled={carrinho.length === 0} loading={cobrando}>
                Cobrar {total > 0 ? fmtBRL(total) : ""}
              </Button>
            )}
            {rodape}
          </Stack>
        </Card>
      </Box>
    </Box>
  );
}

function Chip({ children, ativo, cor, onClick }: { children: ReactNode; ativo: boolean; cor: string; onClick: () => void }) {
  return (
    <Box
      as="button"
     
      onClick={onClick}
      px={3}
      h="32px"
      borderRadius="full"
      fontSize="sm"
      fontWeight="600"
      border="1px solid"
      borderColor={ativo ? cor : "var(--admin-border)"}
      bg={ativo ? cor : "var(--admin-surface)"}
      color={ativo ? "white" : "var(--admin-text)"}
      cursor="pointer"
      whiteSpace="nowrap"
      _hover={{ borderColor: cor }}
    >
      {children}
    </Box>
  );
}

function QtyBtn({ children, onClick, ...rest }: { children: ReactNode; onClick: () => void; "aria-label": string }) {
  return (
    <Box as="button" onClick={onClick} w="30px" h="30px" display="flex" alignItems="center" justifyContent="center" bg="var(--admin-surface)" color="var(--admin-text)" cursor="pointer" _hover={{ bg: "var(--admin-nav-hover)" }} {...rest}>
      {children}
    </Box>
  );
}
