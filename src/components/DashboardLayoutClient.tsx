"use client";

import { useState } from "react";
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
  role,
  userName,
  userEmail,
  userImage,
  children,
}: DashboardLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col md:flex-row">
      {/* Desktop nav */}
      <DashboardNav
        role={role}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
        isMobile={false}
      />

      {/* Mobile nav overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile nav drawer */}
      <DashboardNav
        role={role}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
        isMobile={true}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content */}
      <main className="flex-1 min-h-screen overflow-y-auto w-full md:w-auto pt-16 md:pt-0">
        {/* Mobile menu button */}
        <button
          type="button"
          title="Toggle menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="fixed top-4 left-4 z-30 md:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {children}
      </main>
    </div>
  );
}
