
import { 
  LayoutDashboard, 
  TrendingUp, 
  BarChart3, 
  Droplets, 
  Zap,
  BrainCircuit,
  LucideIcon
} from "lucide-react";

export type NavItem = {
  emoji: string;
  label: string;
  path: string;
  isExternal?: boolean;
  icon?: LucideIcon; // Optional Lucide icon for Sidebar if needed, though we use emojis primarily now
};

export const navItems: NavItem[] = [
  { emoji: "📊", label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { emoji: "📈", label: "Análisis", path: "/analysis", icon: TrendingUp },
  { emoji: "📊", label: "Comparador", path: "/compare", icon: BarChart3 },
  { emoji: "🧠", label: "HMM Trading", path: "/hmm-trading", icon: BrainCircuit },
  { emoji: "💧", label: "Gestión LP", path: "/lp/index.html", isExternal: true, icon: Droplets },
  { emoji: "⚡", label: "QuantEngine", path: "/stock/index.html", isExternal: true, icon: Zap },
];
