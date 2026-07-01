"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import DashboardNav from "@/components/DashboardNav";
import type { ReactNode } from "react";

type Role = "artist" | "venue" | "admin";

interface DashboardLayoutClientProps {
  role: Role;
  userName: string;
  userEmail: string;
  userImage: string | null;
  children: ReactNode;
}

export function DashboardLayoutClient({
  role, userName, userEmail, userImage, children,
}: DashboardLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [railLoaded, setRailLoaded] = useState(false);

  useEffect(() => {
    try {
      setRailCollapsed(localStorage.getItem("lumen-dashboard-rail") === "collapsed");
    } finally {
      setRailLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!railLoaded) return;
    localStorage.setItem("lumen-dashboard-rail", railCollapsed ? "collapsed" : "expanded");
  }, [railCollapsed, railLoaded]);

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-[#09090B] flex flex-col md:flex-row">
      {/* Desktop nav */}
      <DashboardNav
        role={role} userName={userName} userEmail={userEmail}
        userImage={userImage} isMobile={false}
        collapsed={railCollapsed}
        onToggleCollapsed={() => setRailCollapsed((v) => !v)}
      />

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <DashboardNav
        role={role} userName={userName} userEmail={userEmail}
        userImage={userImage} isMobile={true}
        isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main */}
      <main
        className={`flex-1 min-h-screen overflow-y-auto w-full md:w-auto pt-16 md:pt-0 transition-[margin] duration-200 ${
          railCollapsed ? "md:ml-16" : "md:ml-60"
        }`}
      >
        {/* Mobile menu button */}
        <button
          type="button"
          title="Toggle menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="fixed top-4 left-4 z-30 md:hidden w-11 h-11 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </button>

        {children}
      </main>
    </div>
  );
}
