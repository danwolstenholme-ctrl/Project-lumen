import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ArtistDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center gap-4">
      <h1
        className="text-3xl text-white tracking-widest uppercase"
        style={{ fontFamily: "var(--font-raleway)", fontWeight: 700 }}
      >
        Artist Studio
      </h1>
      <p className="text-[#A1A1AA] text-sm tracking-wide">
        Upload portal — coming soon.
      </p>
    </div>
  );
}
