import { NextResponse } from "next/server";
import { getMux } from "@/utils/mux";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  applyAssetReady,
  applyAssetErrored,
  type MuxAsset,
} from "@/utils/muxValidation";

interface UploadEventData {
  id: string;
  asset_id?: string;
  new_asset_settings?: { passthrough?: string };
}

export async function POST(req: Request) {
  const body = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  let event;
  try {
    event = await getMux().webhooks.unwrap(body, headers);
  } catch {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "video.upload.asset_created": {
      // Upload finished; Mux created an asset. Link asset_id to the show row.
      const upload = event.data as UploadEventData;
      const showId = upload.new_asset_settings?.passthrough;
      if (showId && upload.asset_id) {
        await supabase
          .from("shows")
          .update({ mux_asset_id: upload.asset_id })
          .eq("id", showId);
      }
      break;
    }

    case "video.asset.ready": {
      // Mux finished probing + transcoding. Validate against spec, set status.
      await applyAssetReady(supabase, event.data as unknown as MuxAsset);
      break;
    }

    case "video.asset.errored": {
      await applyAssetErrored(supabase, event.data as {
        id: string;
        passthrough?: string;
        errors?: { messages?: string[] };
      });
      break;
    }

    default:
      // Other Mux events (video.asset.created, deleted, master.ready, etc.).
      // We don't act on them but ack to stop retries.
      console.log(`[mux/webhook] ${event.type} (${event.id})`);
  }

  return NextResponse.json({ received: true });
}
