import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import UploadStudio from "./UploadStudio";

export default async function UploadPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  if (role && role !== "artist") redirect(`/dashboard/${role}`);

  return <UploadStudio userId={userId} />;
}
