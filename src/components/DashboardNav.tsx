"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, LayoutGrid, BookOpen, Monitor, Settings, LogOut, DollarSign, Sparkles, X, Sun, Moon } from "lucide-react";
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
  { href: "/dashboard/venue", label: "Library", icon: BookOpen },
  { href: "/dashboard/venue/licenses", label: "My Licenses", icon: LayoutGrid },
  { href: "/dashboard/venue/tables", label: "Tables", icon: Monitor },
  { href: "/dashboard/venue/settings", label: "Settings", icon: Settings },
];

const artistNav: NavItem[] = [
  { href: "/dashboard/artist", label: "Studio", icon: LayoutGrid },
  { href: "/dashboard/artist/upload", label: "Upload Show", icon: BookOpen },
  { href: "/dashboard/artist/earnings", label: "Earnings", icon: DollarSign },
  { href: "/dashboard/artist/boost", label: "Boost Show", icon: Sparkles },
  { href: "/dashboard/artist/settings", label: "Settings", icon: Settings },
];

const adminNav: NavItem[] = [
  { href: "/dashboard/admin", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/admin/users", label: "Users", icon: BookOpen },
  { href: "/dashboard/admin/shows", label: "Shows", icon: Monitor },
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
}

export default function DashboardNav({
  role, userName, userEmail, userImage,
  isMobile = false, isOpen = true, onClose,
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
          ? "fixed inset-0 top-0 z-50 w-60 flex flex-col"
          : "fixed inset-y-0 left-0 z-40 flex flex-col w-60 hidden md:flex"
      } bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-900`}
    >
      {/* Logo + close */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-zinc-200 dark:border-zinc-900">
        <div className="flex items-center gap-2.5">
          <div className="logo-icon w-7 h-7 rounded-sm flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5 text-white" fill="white" />
          </div>
          <span className="font-raleway text-zinc-900 dark:text-white font-semibold text-sm tracking-wide">
            Project Lumen
          </span>
        </div>
        {isMobile && (
          <button
            type="button"
            title="Close menu"
            onClick={onClose}
            className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role badge */}
      <div className="px-5 pt-4 pb-1">
        <span className="text-[10px] font-manrope tracking-widest text-zinc-400 dark:text-zinc-600 uppercase font-medium">
          {role === "venue" ? "Venue" : role === "artist" ? "Artist" : "Admin"} Dashboard
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-manrope font-medium transition-colors ${
                    active
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User + theme toggle + sign out */}
      <div className="border-t border-zinc-200 dark:border-zinc-900 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          {userImage ? (
            <img src={userImage} alt={userName} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <span className="text-xs font-raleway text-zinc-600 dark:text-zinc-300 font-semibold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-manrope text-zinc-900 dark:text-white font-medium truncate">{userName}</span>
            <span className="text-[10px] font-manrope text-zinc-500 truncate">{userEmail}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => signOut(() => router.push("/sign-in"))}
            className="flex items-center gap-2 text-xs font-manrope text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggle}
            className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
