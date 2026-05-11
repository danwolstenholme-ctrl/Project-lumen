import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import DashboardNav from "@/components/DashboardNav";

type Role = "artist" | "venue" | "admin";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const role = (user?.publicMetadata?.role as Role | undefined) ?? "venue";
  const userName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : (user?.emailAddresses?.[0]?.emailAddress ?? "User");
  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const userImage = user?.imageUrl ?? null;

  return (
    <div className="min-h-screen bg-[#09090B] flex">
      <DashboardNav
        role={role}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
      />
      <main className="flex-1 ml-60 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
