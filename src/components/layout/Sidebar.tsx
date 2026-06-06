import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  PhoneCall,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Zap,
  X,
} from "lucide-react";
import LogoMark from '@/components/LogoMark'
import { cn, getInitials } from "@/lib/utils";
import { useAuthStore, useUIStore } from "@/store";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SignOutButton from "@/components/auth/SignOutButton";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/companies", icon: Building2, label: "Pipeline" },
  { href: "/calls/new", icon: PhoneCall, label: "Log a Call" },
  { href: "/memory", icon: Brain, label: "Deal Memory" },
  { href: "/startup-intelligence", icon: Zap, label: "Research" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  onMobileClose?: () => void;
}

export default function Sidebar({ onMobileClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const isDemo = useAuthStore((s) => s.isDemo);
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  // In mobile drawer mode: always expanded, no collapse toggle
  const isMobile = !!onMobileClose;
  const collapsed = isMobile ? false : sidebarCollapsed;

  function handleNavClick(href: string) {
    navigate(href);
    onMobileClose?.();
  }

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        animate={isMobile ? { width: 260 } : { width: collapsed ? 72 : 220 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="relative flex h-full flex-col border-r border-border bg-surface-1 flex-shrink-0"
      >
        {/* Logo */}
        <div className="flex h-14 items-center px-4 border-b border-border flex-shrink-0">
          <AnimatePresence mode="wait">
            {!collapsed ? (
              <motion.div
                key="full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2.5 min-w-0 flex-1"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-conviction flex-shrink-0">
                  <LogoMark className="h-4 w-4" />
                </div>
                <span className="font-semibold text-foreground tracking-tight truncate">
                  Conviction
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-conviction mx-auto"
              >
                <LogoMark className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile close button */}
          {isMobile && (
            <button
              onClick={onMobileClose}
              className="ml-2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors flex-shrink-0"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* New Call CTA */}
        <div className={cn("px-3 pt-3 pb-1 flex-shrink-0")}>
          {!collapsed ? (
            <Button
              variant="conviction"
              size="sm"
              className="w-full"
              data-tour="tour-log-call"
              onClick={() => handleNavClick("/calls/new")}
            >
              <Plus className="h-3.5 w-3.5" />
              Log Call
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="conviction"
                  size="icon-sm"
                  className="w-full"
                  data-tour="tour-log-call"
                  onClick={() => handleNavClick("/calls/new")}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Log Call</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden thin-scrollbar px-2 py-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const tourId =
              item.href === '/dashboard' ? 'tour-nav-dashboard'
              : item.href === '/companies' ? 'tour-nav-pipeline'
              : item.href === '/calls/new' ? 'tour-nav-log-call'
              : item.href === '/memory' ? 'tour-nav-memory'
              : item.href === '/startup-intelligence' ? 'tour-nav-research'
              : item.href === '/settings' ? 'tour-nav-settings'
              : undefined
            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.href}
                      data-tour={tourId}
                      onClick={() => onMobileClose?.()}
                      className={({ isActive }) =>
                        cn(
                          "flex h-10 w-full items-center justify-center rounded-md transition-all duration-100",
                          isActive
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                        )
                      }
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return (
              <NavLink
                key={item.href}
                to={item.href}
                data-tour={tourId}
                onClick={() => onMobileClose?.()}
                className={({ isActive }) =>
                  cn(
                    "flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-sm transition-all duration-100",
                    isActive
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )
                }
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <motion.span
                  initial={false}
                  animate={{ opacity: 1 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              </NavLink>
            );
          })}
        </nav>

        {/* User */}
        <div
          className={cn("border-t border-border p-3 flex-shrink-0 space-y-1")}
        >
          {isDemo && !collapsed && (
            <div className="px-2 pb-1">
              <Badge className="text-2xs bg-amber-500/15 text-amber-400 border-amber-500/30 w-full justify-center">
                Demo workspace
              </Badge>
            </div>
          )}
          {user && (
            <>
              <div
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 cursor-pointer hover:bg-secondary/60 transition-colors",
                  collapsed && "justify-center px-0"
                )}
                onClick={() => handleNavClick("/settings")}
              >
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="min-w-0"
                  >
                    <p className="text-xs font-medium truncate text-foreground">
                      {user.name}
                    </p>
                    <p className="text-2xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </motion.div>
                )}
              </div>
              <SignOutButton collapsed={collapsed} />
            </>
          )}
        </div>

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="absolute top-[52px] -right-3 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </button>
        )}
      </motion.aside>
    </TooltipProvider>
  );
}
