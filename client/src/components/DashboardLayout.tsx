import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { CSSProperties, useState, useEffect, useRef } from "react";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import React from "react";
import Footer from "./Footer";
import { useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { PanelLeft, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ZetaLogo from "./ZetaLogo";
import { navItems, bottomNavItems } from "@/lib/navigation";

const MIN_WIDTH = 220;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar": "#F4F7FC",
          "--sidebar-border": "#e2e8f0",
          "--sidebar-ring": "#3b82f6",
        } as React.CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={() => {}}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  return (
    <div className="flex min-h-screen w-full bg-[#F4F7FC] overflow-hidden">
      <div className="relative z-20 flex-shrink-0" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-slate-200 bg-[#F4F7FC]"
          disableTransition={isResizing}
        >
          <div className="flex flex-col h-full overflow-hidden">
            <SidebarHeader className="h-20 justify-center">
              <div className="flex items-center gap-3 px-4 transition-all w-full mt-4">
                <div className="h-8 w-8 flex items-center justify-center shrink-0">
                  <ZetaLogo className="h-6 w-6 text-slate-800" />
                </div>
                {!isCollapsed ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl font-bold tracking-tight truncate text-slate-900">
                      BlockStock
                    </span>
                  </div>
                ) : null}
              </div>
            </SidebarHeader>

            <SidebarContent className="flex-1 overflow-y-auto px-3 py-4">
              <SidebarMenu className="gap-2">
                {navItems.map(item => {
                  const isActive = location === item.path || (location === "/" && item.path === "/dashboard");
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => {
                          if (item.isExternal) {
                            window.location.href = item.path;
                          } else {
                            setLocation(item.path);
                          }
                        }}
                        tooltip={item.label}
                        className={`h-11 transition-all rounded-full px-4 ${
                          isActive 
                            ? "bg-slate-50 text-slate-900 hover:bg-white shadow-sm hover:text-slate-900" 
                            : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 font-medium"
                        }`}
                      >
                        {Icon && (
                          <Icon
                            className={`h-5 w-5 mr-3 ${isActive ? "text-slate-900" : "text-slate-500"}`}
                          />
                        )}
                        <span className="text-sm">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarContent>

            <div className="px-3 pb-4">
              <SidebarMenu className="gap-1 mb-6">
                {bottomNavItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        onClick={() => setLocation(item.path)}
                        tooltip={item.label}
                        className="h-10 transition-all rounded-full px-4 text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 font-medium"
                      >
                        {Icon && <Icon className="h-4 w-4 mr-3 text-slate-500" />}
                        <span className="text-sm">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>

            <SidebarFooter className="p-4 mb-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 bg-slate-200 text-slate-600 p-2 shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-transparent">
                      {user?.name?.charAt(0).toUpperCase() || 'H'}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate flex items-center gap-1">
                        {user?.name || "Hector"}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {user?.email || "hector@blockstock.com"}
                      </p>
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  <button 
                    onClick={logout} 
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 rounded-full transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </div>
            </SidebarFooter>
          </div>
        </Sidebar>
      </div>

      <SidebarInset className="bg-[#F4F7FC]">
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-white px-4 border-slate-200 sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-slate-100" />
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ZetaLogo className="h-5 w-5" />
                <span>BlockStock</span>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 overflow-y-auto pt-6 md:pt-10 px-4 md:px-8 pb-0 flex flex-col">
          <div className="w-full max-w-7xl mx-auto flex-1">{children}</div>
          <Footer />
        </main>
      </SidebarInset>
    </div>
  );
}
