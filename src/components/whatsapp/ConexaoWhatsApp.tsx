"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, HStack, Image, Spinner, Stack, Text } from "../../primitives";
import { Input } from "../controls";
import { Button } from "../Button";
import { Check, Copy, KeyRound, QrCode, Smartphone } from "lucide-react";

/**
 * Painel de CONEXÃO do WhatsApp — QR × número, componente ÚNICO da plataforma.
 *
 * O WhatsApp aceita dois caminhos para ligar um aparelho: ler o QR ou digitar um
 * código de 8 dígitos no celular. Antes só tínhamos o QR, e cada tela montava o
 * seu; agora as duas vias vivem aqui e todas as telas (sistema, tenants,
 * representantes, clientes externos) recebem a mesma coisa.
 *
 * PURO por contrato: nada de fetch, actions ou router aqui dentro. Quem monta
 * passa o QR já pronto e um `onPair` que devolve o código. O polling do status
 * continua sendo de quem monta — é ele que sabe onde está a instância.
 */

export type ConexaoWhatsAppPairResult =
  | { ok: true; code: string; expiresInMs?: number }
  | { ok: false; error: string };

export type ConexaoWhatsAppModo = "qr" | "numero";

export interface ConexaoWhatsAppProps {
  /** QR em data-URL ou base64 cru. `null` enquanto o servidor ainda não emitiu. */
  qrBase64?: string | null;
  /** Há um pedido de conexão em curso (mostra o spinner enquanto não há QR). */
  carregando?: boolean;
  /** Pede o código de pareamento para este número (dígitos com país e DDD). */
  onPair: (phone: string) => Promise<ConexaoWhatsAppPairResult>;
  /** Avisado quando o usuário troca de via — use para (re)disparar o connect. */
  onModoChange?: (modo: ConexaoWhatsAppModo) => void;
  /** Código já em curso (vindo do polling), para a tela sobreviver a um refresh. */
  pairingCode?: string | null;
  /** Preenche o campo de número (ex.: o telefone que já se conhece da instância). */
  defaultPhone?: string | null;
  /** Lado do QR, em px. */
  qrSize?: number;
  /** Botões da tela (Conectar, Parar, Resetar…) — ficam por baixo das duas vias. */
  actions?: React.ReactNode;
}

const VALIDADE_PADRAO_MS = 180_000;

function apenasDigitos(v: string): string {
  return v.replace(/\D/g, "");
}

/** 5511987654321 → "+55 11 98765-4321" (só cosmético; enviamos os dígitos). */
function formatarTelefone(digitos: string): string {
  if (digitos.length < 11) return digitos;
  const pais = digitos.slice(0, digitos.length - 10);
  const ddd = digitos.slice(-10, -8);
  const resto = digitos.slice(-8);
  return `+${pais} ${ddd} ${resto.slice(0, 4)}-${resto.slice(4)}`;
}

function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function ConexaoWhatsApp({
  qrBase64,
  carregando = false,
  onPair,
  onModoChange,
  pairingCode,
  defaultPhone,
  qrSize = 240,
  actions,
}: ConexaoWhatsAppProps) {
  const [modo, setModo] = useState<ConexaoWhatsAppModo>("qr");
  const [phone, setPhone] = useState(() => apenasDigitos(defaultPhone ?? ""));
  const [codigo, setCodigo] = useState<string | null>(pairingCode ?? null);
  const [expiraEm, setExpiraEm] = useState<number | null>(null);
  const [restante, setRestante] = useState<number>(0);
  const [pedindo, setPedindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const copiadoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // O código que chega pelo polling só ENTRA — nunca apaga o que acabamos de
  // pedir. Se apagasse, a tela piscaria vazia no primeiro tick após o pedido.
  useEffect(() => {
    if (!pairingCode) return;
    setCodigo(pairingCode);
    setExpiraEm((atual) => atual ?? Date.now() + VALIDADE_PADRAO_MS);
  }, [pairingCode]);

  useEffect(() => {
    if (!expiraEm) return;
    const tick = () => setRestante(expiraEm - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiraEm]);

  useEffect(() => {
    return () => {
      if (copiadoTimer.current) clearTimeout(copiadoTimer.current);
    };
  }, []);

  const expirado = expiraEm != null && restante <= 0;
  const qrSrc = useMemo(() => {
    if (!qrBase64) return null;
    return qrBase64.startsWith("data:") ? qrBase64 : `data:image/png;base64,${qrBase64}`;
  }, [qrBase64]);

  const trocarModo = (novo: ConexaoWhatsAppModo) => {
    if (novo === modo) return;
    setModo(novo);
    setErro(null);
    onModoChange?.(novo);
  };

  const pedirCodigo = async () => {
    const digitos = apenasDigitos(phone);
    if (digitos.length < 10 || digitos.length > 15) {
      setErro("Escreva o número com código do país e DDD (ex.: 5511987654321).");
      return;
    }
    setPedindo(true);
    setErro(null);
    setCodigo(null);
    setExpiraEm(null);
    try {
      const r = await onPair(digitos);
      if (!r.ok) {
        setErro(r.error);
        return;
      }
      setCodigo(r.code);
      setExpiraEm(Date.now() + (r.expiresInMs ?? VALIDADE_PADRAO_MS));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível pedir o código.");
    } finally {
      setPedindo(false);
    }
  };

  const copiar = async () => {
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(codigo.replace(/\W/g, ""));
      setCopiado(true);
      if (copiadoTimer.current) clearTimeout(copiadoTimer.current);
      copiadoTimer.current = setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* clipboard bloqueado (http, permissão) — o código está no ecrã na mesma */
    }
  };

  return (
    <Stack gap={4} align="flex-start" w="full">
      {/* Seletor da via — dois botões, não um select: são só duas e ambas cabem */}
      <HStack
        gap={0}
        p="3px"
        bg="var(--admin-surface-soft, rgba(0,0,0,0.04))"
        borderRadius="10px"
        border="1px solid var(--admin-border)"
      >
        <Button
          tone={modo === "qr" ? "primary" : "ghost"}
          size="sm"
          onClick={() => trocarModo("qr")}
        >
          <QrCode size={15} style={{ marginRight: 6 }} /> QR Code
        </Button>
        <Button
          tone={modo === "numero" ? "primary" : "ghost"}
          size="sm"
          onClick={() => trocarModo("numero")}
        >
          <Smartphone size={15} style={{ marginRight: 6 }} /> Número de telefone
        </Button>
      </HStack>

      {modo === "qr" ? (
        <Stack gap={3} align="flex-start">
          <Text fontSize="sm" color="var(--admin-text-soft)">
            No celular: <b>WhatsApp → Aparelhos conectados → Conectar um aparelho</b> e
            aponte a câmera para o código.
          </Text>
          {qrSrc ? (
            <Box bg="white" p={3} borderRadius="12px" w="fit-content">
              <Image src={qrSrc} alt="QR Code" w={`${qrSize}px`} h={`${qrSize}px`} />
            </Box>
          ) : carregando ? (
            <Spinner size="md" color="var(--admin-accent)" />
          ) : (
            <Text fontSize="sm" color="var(--admin-text-soft)">
              Clique em <b>Conectar</b> para gerar o QR.
            </Text>
          )}
        </Stack>
      ) : (
        <Stack gap={3} align="flex-start" w="full" maxW="420px">
          <Text fontSize="sm" color="var(--admin-text-soft)">
            No celular: <b>WhatsApp → Aparelhos conectados → Conectar um aparelho →
            Conectar com número de telefone</b>, e digite o código abaixo.
          </Text>
          <HStack gap={2} w="full">
            <Input
              value={phone}
              onChange={(e) => setPhone(apenasDigitos(e.target.value))}
              placeholder="5511987654321"
              inputMode="numeric"
              maxLength={15}
              disabled={pedindo}
            />
            <Button onClick={pedirCodigo} loading={pedindo} disabled={pedindo}>
              <KeyRound size={15} style={{ marginRight: 6 }} /> Gerar código
            </Button>
          </HStack>
          <Text fontSize="xs" color="var(--admin-text-soft)">
            Com código do país e DDD, só dígitos. {phone.length >= 11 ? formatarTelefone(phone) : ""}
          </Text>

          {codigo && (
            <Box
              className="admin-card"
              p={4}
              w="full"
              opacity={expirado ? 0.55 : 1}
              borderColor={expirado ? "var(--admin-border)" : "var(--admin-primary)"}
            >
              <Stack gap={2}>
                <HStack justify="space-between" align="center">
                  <Text
                    fontSize="2xl"
                    fontWeight="700"
                    letterSpacing="0.18em"
                    fontFamily="mono"
                  >
                    {codigo}
                  </Text>
                  <Button tone="ghost" size="sm" onClick={copiar}>
                    {copiado ? <Check size={15} /> : <Copy size={15} />}
                  </Button>
                </HStack>
                <Text fontSize="xs" color={expirado ? "red.600" : "var(--admin-text-soft)"}>
                  {expirado
                    ? "Código expirado — gere outro."
                    : `Válido por ${mmss(restante)}. Digite no celular antes de expirar.`}
                </Text>
              </Stack>
            </Box>
          )}
        </Stack>
      )}

      {erro && (
        <Text fontSize="sm" color="red.600">
          {erro}
        </Text>
      )}

      {actions}
    </Stack>
  );
}
