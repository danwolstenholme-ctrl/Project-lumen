import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardLayoutClient } from "@/components/DashboardLayoutClient";

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
    <DashboardLayoutClient
      role={role}
      userName={userName}
      userEmail={userEmail}
      userImage={userImage}
    >
      {children}
    </DashboardLayoutClient>
  );
}
