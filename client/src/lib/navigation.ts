import { 
  LayoutDashboard, 
  TrendingUp, 
  BarChart3, 
  Droplets, 
  Zap,
  BrainCircuit,
  Settings,
  User,
  HelpCircle,
  LucideIcon
} from "lucide-react";

export type NavItem = {
  emoji?: string;
  label: string;
  path: string;
  isExternal?: boolean;
  icon?: LucideIcon;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Análisis", path: "/analysis", icon: TrendingUp },
  { label: "Comparador", path: "/compare", icon: BarChart3 },
  { label: "HMM Trading", path: "/hmm-trading", icon: BrainCircuit },
  { label: "Gestión LP", path: "/lp/index.html", isExternal: true, icon: Droplets },
  { label: "QuantEngine", path: "/stock/index.html", isExternal: true, icon: Zap },
];

export const bottomNavItems: NavItem[] = [
  { label: "Application Settings", path: "/settings/app", icon: Settings },
  { label: "User Settings", path: "/settings", icon: User },
  { label: "Help", path: "/help", icon: HelpCircle },
];
