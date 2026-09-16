"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Box, HStack, Stack, Text, chakra } from "@chakra-ui/react";
import { Link2, Mail, QrCode, Share2 } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTelegram, FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import { Button, type ButtonTone } from "./Button";
import { Modal } from "./Modal";
import { copiarTexto } from "./TextoCopiavel";
import { toast } from "./Toast";

export type CanalDivulgacao = {
  id: string;
  rotulo: string;
  cor: string;
  icone: ReactNode;
  href?: string;
  copiarAntes?: boolean;
};

function enc(v: string): string {
  return encodeURIComponent(v);
}

export function canaisDeDivulgacao(url: string, titulo: string, texto?: string): CanalDivulgacao[] {
  const frase = [titulo, texto].filter(Boolean).join(" — ");
  return [
    {
      id: "whatsapp",
      rotulo: "WhatsApp",
      cor: "#25D366",
      icone: <FaWhatsapp size={20} />,
      href: `https://wa.me/?text=${enc(`${frase}\n${url}`)}`,
    },
    {
      id: "facebook",
      rotulo: "Facebook",
      cor: "#1877F2",
      icone: <FaFacebookF size={18} />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    },
    {
      id: "instagram",
      rotulo: "Instagram",
      cor: "#E1306C",
      icone: <FaInstagram size={20} />,
      href: "https://www.instagram.com/",
      copiarAntes: true,
    },
    {
      id: "telegram",
      rotulo: "Telegram",
      cor: "#229ED9",
      icone: <FaTelegram size={20} />,
      href: `https://t.me/share/url?url=${enc(url)}&text=${enc(frase)}`,
    },
    {
      id: "x",
      rotulo: "X",
      cor: "#0f172a",
      icone: <FaXTwitter size={18} />,
      href: `https://x.com/intent/tweet?url=${enc(url)}&text=${enc(frase)}`,
    },
    {
      id: "email",
      rotulo: "E-mail",
      cor: "#64748b",
      icone: <Mail size={18} />,
      href: `mailto:?subject=${enc(titulo)}&body=${enc(`${frase}\n${url}`)}`,
    },
  ];
}

function Quadro({ canal, url }: { canal: CanalDivulgacao; url: string }) {
  async function abrir() {
    if (canal.copiarAntes) {
      const ok = await copiarTexto(url);
      if (ok) toast.success("Link copiado", "Cole no seu story ou na bio do Instagram.");
    }
  }
  return (
    <chakra.a
      href={canal.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={abrir}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
      py={4}
      px={2}
      borderRadius="14px"
      borderWidth="1px"
      borderColor="var(--admin-border, rgba(0,0,0,.1))"
      background="var(--admin-surface-soft, rgba(0,0,0,.02))"
      color="var(--admin-text, inherit)"
      textAlign="center"
      transition="transform .12s ease, box-shadow .12s ease"
      _hover={{ transform: "translateY(-2px)", boxShadow: "0 10px 24px rgba(15,23,42,.12)" }}
    >
      <Box
        w="42px"
        h="42px"
        borderRadius="999px"
        display="grid"
        placeItems="center"
        background={canal.cor}
        color="#fff"
      >
        {canal.icone}
      </Box>
      <Text fontSize="xs" fontWeight="600">
        {canal.rotulo}
      </Text>
    </chakra.a>
  );
}

export function PainelDivulgar({
  url,
  titulo,
  texto,
  qrSrc,
}: {
  url: string;
  titulo: string;
  texto?: string;
  qrSrc?: string;
}) {
  const [nativo, setNativo] = useState(false);
  const [qr, setQr] = useState(false);

  useEffect(() => {
    setNativo(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  async function compartilhar() {
    try {
      await navigator.share({ title: titulo, text: texto, url });
    } catch {
      return;
    }
  }

  async function copiar() {
    const ok = await copiarTexto(url);
    if (ok) toast.success("Link copiado");
    else toast.error("Não consegui copiar", "Selecione o link e copie na mão.");
  }

  return (
    <Stack gap={4}>
      <Box
        display="grid"
        gridTemplateColumns={{ base: "repeat(3, minmax(0, 1fr))", sm: "repeat(6, minmax(0, 1fr))" }}
        gap={2}
      >
        {canaisDeDivulgacao(url, titulo, texto).map((c) => (
          <Quadro key={c.id} canal={c} url={url} />
        ))}
      </Box>

      <HStack
        gap={2}
        borderWidth="1px"
        borderColor="var(--admin-border, rgba(0,0,0,.1))"
        borderRadius="12px"
        px={3}
        py={2}
        background="var(--admin-surface-soft, rgba(0,0,0,.02))"
      >
        <Box color="var(--admin-text-soft, #64748b)" flexShrink={0} display="grid" placeItems="center">
          <Link2 size={16} />
        </Box>
        <Text fontSize="sm" fontFamily="mono" truncate flex="1" minW={0} title={url}>
          {url}
        </Text>
        <Button size="xs" onClick={copiar}>
          Copiar
        </Button>
      </HStack>

      <HStack gap={2} wrap="wrap">
        {nativo ? (
          <Button size="sm" onClick={compartilhar}>
            <Share2 size={15} /> Compartilhar…
          </Button>
        ) : null}
        {qrSrc ? (
          <Button size="sm" tone="outline" onClick={() => setQr((v) => !v)}>
            <QrCode size={15} /> {qr ? "Esconder QR" : "Mostrar QR"}
          </Button>
        ) : null}
      </HStack>

      {qrSrc && qr ? (
        <Box display="grid" placeItems="center" py={2}>
          <Box borderRadius="12px" overflow="hidden" borderWidth="1px" borderColor="var(--admin-border, rgba(0,0,0,.1))">
            <img src={qrSrc} alt={`QR de ${titulo}`} width={220} height={220} style={{ display: "block" }} />
          </Box>
        </Box>
      ) : null}
    </Stack>
  );
}

export function ModalDivulgar({
  open,
  onClose,
  url,
  titulo,
  texto,
  qrSrc,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  titulo: string;
  texto?: string;
  qrSrc?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Divulgar" size="lg">
      <PainelDivulgar url={url} titulo={titulo} texto={texto} qrSrc={qrSrc} />
    </Modal>
  );
}

export function BotaoDivulgar({
  url,
  titulo,
  texto,
  qrSrc,
  rotulo = "Divulgar",
  size = "sm",
  tone,
}: {
  url: string;
  titulo: string;
  texto?: string;
  qrSrc?: string;
  rotulo?: string;
  size?: "xs" | "sm" | "md";
  tone?: ButtonTone;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <Button size={size} tone={tone} onClick={() => setAberto(true)}>
        <Share2 size={15} /> {rotulo}
      </Button>
      <ModalDivulgar
        open={aberto}
        onClose={() => setAberto(false)}
        url={url}
        titulo={titulo}
        texto={texto}
        qrSrc={qrSrc}
      />
    </>
  );
}
