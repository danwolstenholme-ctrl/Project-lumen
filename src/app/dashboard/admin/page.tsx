import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1
        className="text-3xl text-zinc-900 dark:text-white tracking-widest uppercase"
        style={{ fontFamily: "var(--font-raleway)", fontWeight: 700 }}
      >
        Admin Panel
      </h1>
      <p className="text-zinc-500 text-sm tracking-wide">
        Review queue and management — coming soon.
      </p>
    </div>
  );
}
