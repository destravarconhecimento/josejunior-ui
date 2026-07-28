/**
 * Registro de ícones por NOME — fonte única de todo site público da plataforma
 * (landing de segmento, site do representante, josejunior.dev).
 *
 * O nome é uma STRING gravada no banco (ex.: `"dumbbell"`), nunca o componente:
 * conteúdo é dado, não JSX. Isso é o que permite a IA e o CMS escolherem ícone,
 * e evita o problema de passar componente lucide como prop de Server Component
 * para Client Component (ver memória `rsc-icon-forwardref-emptystate`).
 *
 * Nome desconhecido cai no fallback (Sparkles) — nunca quebra a página.
 *
 * `apps/web/src/content/icons.ts` re-exporta daqui (era uma cópia; os nomes
 * antigos continuam todos válidos). O seletor do editor usa `SITE_ICON_NAMES`.
 */
import {
  Activity, Award, Baby, BadgeCheck, BarChart3, Bell, BookOpen, Bot, Brain, Briefcase,
  Building2, CalendarCheck, CalendarDays, Camera, Car, CheckCircle2, ClipboardList, Clock,
  Cloud, Code2, Coins, CreditCard, Cpu, Database, Download, Droplet, Dumbbell, Eye,
  FileText, Filter, Flame, Folder, Gauge, Gift, Globe, GraduationCap, Hammer, Handshake,
  Headphones, Heart, Home, Instagram, Key, Languages, Layers, LayoutDashboard, LayoutGrid,
  Leaf, Link2, Linkedin, List, Lock, Mail, MapPin, Mic, MessageCircle, MessageSquare, Music,
  Package, Palette, PenLine, Phone, PieChart, Pill, Plane, Plug, Printer, QrCode, Receipt,
  RefreshCw, Rocket, Ruler, Scale, Scissors, Search, Send, Server, Share2, ShieldCheck,
  Shirt, ShoppingBag, ShoppingCart, Smartphone, Sparkles, Sprout, Star, Stethoscope, Store, Sun, Target,
  Thermometer, ThumbsUp, Ticket, Timer, TrendingUp, Trophy, Truck, Tv, UserPlus, Users,
  Utensils, Video, Wallet, Wifi, Workflow, Wrench, Zap,
  type LucideIcon,
} from "lucide-react";

const REGISTRY: Record<string, LucideIcon> = {
  // — nomes herdados do CMS do josejunior.dev (não renomear: estão no banco) —
  brain: Brain,
  "trending-up": TrendingUp,
  "layout-dashboard": LayoutDashboard,
  zap: Zap,
  globe: Globe,
  smartphone: Smartphone,
  "message-circle": MessageCircle,
  plug: Plug,
  code: Code2,
  "graduation-cap": GraduationCap,
  languages: Languages,
  "map-pin": MapPin,
  phone: Phone,
  mail: Mail,
  instagram: Instagram,
  linkedin: Linkedin,
  sparkles: Sparkles,
  rocket: Rocket,
  shield: ShieldCheck,
  clock: Clock,
  users: Users,
  "bar-chart": BarChart3,
  heart: Heart,
  check: CheckCircle2,
  star: Star,
  target: Target,
  palette: Palette,
  database: Database,
  cpu: Cpu,
  bot: Bot,
  workflow: Workflow,
  wrench: Wrench,
  wallet: Wallet,
  handshake: Handshake,
  "user-plus": UserPlus,
  coins: Coins,
  search: Search,
  "calendar-check": CalendarCheck,
  hammer: Hammer,
  "badge-check": BadgeCheck,

  // — confiança / plataforma (faixa de garantias da landing de segmento) —
  "credit-card": CreditCard,
  headphones: Headphones,
  lock: Lock,
  key: Key,
  server: Server,
  cloud: Cloud,
  timer: Timer,
  gauge: Gauge,
  refresh: RefreshCw,
  bell: Bell,
  eye: Eye,
  send: Send,
  share: Share2,
  link: Link2,
  download: Download,
  filter: Filter,
  list: List,
  grid: LayoutGrid,
  layers: Layers,
  activity: Activity,
  "pie-chart": PieChart,

  // — vocabulário dos segmentos que a gente vende —
  dumbbell: Dumbbell,
  stethoscope: Stethoscope,
  pill: Pill,
  thermometer: Thermometer,
  baby: Baby,
  home: Home,
  building: Building2,
  store: Store,
  scale: Scale,
  "file-text": FileText,
  folder: Folder,
  calendar: CalendarDays,
  clipboard: ClipboardList,
  "message-square": MessageSquare,
  camera: Camera,
  video: Video,
  music: Music,
  mic: Mic,
  tv: Tv,
  wifi: Wifi,
  printer: Printer,
  "qr-code": QrCode,
  receipt: Receipt,
  ticket: Ticket,
  trophy: Trophy,
  award: Award,
  flame: Flame,
  leaf: Leaf,
  sprout: Sprout,
  sun: Sun,
  droplet: Droplet,
  truck: Truck,
  car: Car,
  plane: Plane,
  package: Package,
  gift: Gift,
  "shopping-cart": ShoppingCart,
  "shopping-bag": ShoppingBag,
  shirt: Shirt,
  scissors: Scissors,
  utensils: Utensils,
  ruler: Ruler,
  briefcase: Briefcase,
  book: BookOpen,
  pen: PenLine,
  "thumbs-up": ThumbsUp,
};

/** Nomes válidos — fonte de verdade também pro seletor de ícone dos editores. */
export const SITE_ICON_NAMES = Object.keys(REGISTRY);

/** Resolve o nome do ícone pro componente Lucide (fallback = Sparkles). */
export function resolveSiteIcon(name?: string | null): LucideIcon {
  return REGISTRY[(name ?? "").trim().toLowerCase()] ?? Sparkles;
}

export type { LucideIcon };
