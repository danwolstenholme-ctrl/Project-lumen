"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap, LayoutGrid, BookOpen, Monitor, LogOut, DollarSign, Sparkles, X, Sun, Moon,
  Play, Settings, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

type Role = "artist" | "venue" | "admin";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const venueNav: NavItem[] = [
  { href: "/dashboard/venue/quickplay", label: "Quick Play", icon: Play },
  { href: "/dashboard/venue", label: "Show Library", icon: BookOpen },
  { href: "/dashboard/venue/control", label: "Control Panel", icon: Monitor },
  { href: "/dashboard/venue/tables", label: "Tables", icon: LayoutGrid },
];

const artistNav: NavItem[] = [
  { href: "/dashboard/artist", label: "Studio", icon: LayoutGrid },
  { href: "/dashboard/artist/upload", label: "Upload", icon: BookOpen },
  { href: "/dashboard/artist/earnings", label: "Earnings", icon: DollarSign },
  { href: "/dashboard/artist/boost", label: "Boost", icon: Sparkles },
  { href: "/dashboard/artist/settings", label: "Settings", icon: Settings },
];

const adminNav: NavItem[] = [
  { href: "/dashboard/admin", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/admin/shows", label: "Review Queue", icon: Sparkles },
];

const navByRole: Record<Role, NavItem[]> = {
  venue: venueNav,
  artist: artistNav,
  admin: adminNav,
};

interface DashboardNavProps {
  role: Role;
  userName: string;
  userEmail: string;
  userImage?: string | null;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export default function DashboardNav({
  role, userName, userEmail, userImage,
  isMobile = false, isOpen = true, onClose,
  collapsed = false, onToggleCollapsed,
}: DashboardNavProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const items = navByRole[role] ?? venueNav;

  if (isMobile && !isOpen) return null;

  return (
    <aside
      className={`${
        isMobile
          ? "fixed inset-y-0 left-0 z-50 w-[min(18rem,calc(100vw-2rem))] flex flex-col"
          : `fixed inset-y-0 left-0 z-40 hidden md:flex flex-col transition-[width] duration-200 ${collapsed ? "w-16" : "w-60"}`
      } relative bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-900`}
    >
      {/* Logo + close */}
      <div className={`flex items-center border-b border-zinc-200 dark:border-zinc-900 ${collapsed && !isMobile ? "justify-center px-2 py-4" : "justify-between px-5 py-5"}`}>
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="logo-icon w-7 h-7 rounded-sm flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5 text-white" fill="white" />
          </div>
          <span className={`font-raleway text-zinc-900 dark:text-white font-semibold text-sm tracking-wide truncate ${collapsed && !isMobile ? "sr-only" : ""}`}>
            Project Lumen
          </span>
        </div>
        {isMobile ? (
          <button
            type="button"
            title="Close menu"
            onClick={onClose}
            className="w-11 h-11 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            title={collapsed ? "Expand menu" : "Collapse menu"}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            onClick={onToggleCollapsed}
            className={`hidden md:flex w-11 h-11 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors items-center justify-center ${collapsed ? "absolute left-[62px] top-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm" : ""}`}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Role badge */}
      <div className={`${collapsed && !isMobile ? "px-2 pt-4 pb-1 text-center" : "px-5 pt-4 pb-1"}`}>
        <span className="text-[10px] font-manrope tracking-widest text-zinc-400 dark:text-zinc-600 uppercase font-medium">
          {collapsed && !isMobile
            ? (role === "venue" ? "Venue" : role === "artist" ? "Artist" : "Admin").slice(0, 1)
            : `${role === "venue" ? "Venue" : role === "artist" ? "Artist" : "Admin"} Dashboard`}
        </span>
      </div>

      {/* Nav items */}
      <nav className={`flex-1 py-2 overflow-y-auto ${collapsed && !isMobile ? "px-2" : "px-3"}`}>
        <ul className="flex flex-col gap-0.5">
          {items.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard/artist" &&
                href !== "/dashboard/venue" &&
                href !== "/dashboard/admin" &&
                pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={isMobile ? onClose : undefined}
                  title={collapsed && !isMobile ? label : undefined}
                  className={`flex min-h-11 items-center rounded-lg text-sm font-manrope font-medium transition-colors ${
                    collapsed && !isMobile ? "justify-center px-0 py-0" : "gap-3 px-3 py-2"
                  } ${
                    active
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className={collapsed && !isMobile ? "sr-only" : ""}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User + theme toggle + sign out */}
      <div className={`border-t border-zinc-200 dark:border-zinc-900 ${collapsed && !isMobile ? "px-2 py-3" : "px-4 py-4"}`}>
        <div className={`flex items-center gap-3 mb-3 ${collapsed && !isMobile ? "justify-center" : ""}`}>
          {userImage ? (
            <img src={userImage} alt={userName} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <span className="text-xs font-raleway text-zinc-600 dark:text-zinc-300 font-semibold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className={`flex flex-col min-w-0 ${collapsed && !isMobile ? "sr-only" : ""}`}>
            <span className="text-xs font-manrope text-zinc-900 dark:text-white font-medium truncate">{userName}</span>
            <span className="text-[10px] font-manrope text-zinc-500 truncate">{userEmail}</span>
          </div>
        </div>

        <div className={`flex items-center ${collapsed && !isMobile ? "flex-col gap-1" : "justify-between"}`}>
          <button
            type="button"
            title="Sign out"
            onClick={() => signOut(() => router.push("/sign-in"))}
            className={`flex min-h-11 items-center rounded-lg text-xs font-manrope text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors ${
              collapsed && !isMobile ? "w-11 justify-center" : "gap-2 px-2"
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className={collapsed && !isMobile ? "sr-only" : ""}>Sign out</span>
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggle}
            className="w-11 h-11 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
