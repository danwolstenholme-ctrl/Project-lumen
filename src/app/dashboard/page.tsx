import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type Role = "artist" | "venue" | "admin";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const role = user?.publicMetadata?.role as Role | undefined;

  if (role === "artist") redirect("/dashboard/artist");
  if (role === "venue") redirect("/dashboard/venue");
  if (role === "admin") redirect("/dashboard/admin");

  // No role assigned yet — show role selection
  redirect("/onboarding");
}
