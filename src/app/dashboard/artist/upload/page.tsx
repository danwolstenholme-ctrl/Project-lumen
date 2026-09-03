import UploadStudio from "./UploadStudio";
import { requirePageRole } from "@/utils/auth";

export default async function UploadPage() {
  const { userId } = await requirePageRole("artist");

  return <UploadStudio userId={userId} />;
}
