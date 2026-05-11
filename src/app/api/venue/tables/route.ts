import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

const IP_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

async function ensureVenue(userId: string) {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("venues")
    .select("id, name")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing;
  const { data, error } = await supabase
    .from("venues")
    .insert({ user_id: userId, name: "My Venue" })
    .select("id, name")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { label, ip_address } = await req.json();
  if (!label || typeof label !== "string") {
    return NextResponse.json({ error: "Label is required" }, { status: 400 });
  }
  if (ip_address && !IP_REGEX.test(ip_address)) {
    return NextResponse.json({ error: "Invalid IP address" }, { status: 400 });
  }

  const venue = await ensureVenue(userId);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tables")
    .insert({
      venue_id: venue.id,
      label: label.slice(0, 40),
      ip_address: ip_address ?? null,
      status: "offline",
    })
    .select("id, label, ip_address, status")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ table: data });
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, label, ip_address } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (ip_address && !IP_REGEX.test(ip_address)) {
    return NextResponse.json({ error: "Invalid IP address" }, { status: 400 });
  }

  const supabase = createAdminClient();
  // verify ownership
  const { data: venue } = await supabase.from("venues").select("id").eq("user_id", userId).maybeSingle();
  if (!venue) return NextResponse.json({ error: "No venue" }, { status: 404 });

  const { data, error } = await supabase
    .from("tables")
    .update({
      ...(label !== undefined ? { label: String(label).slice(0, 40) } : {}),
      ...(ip_address !== undefined ? { ip_address: ip_address || null } : {}),
    })
    .eq("id", id)
    .eq("venue_id", venue.id)
    .select("id, label, ip_address, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ table: data });
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: venue } = await supabase.from("venues").select("id").eq("user_id", userId).maybeSingle();
  if (!venue) return NextResponse.json({ error: "No venue" }, { status: 404 });

  const { error } = await supabase
    .from("tables")
    .delete()
    .eq("id", id)
    .eq("venue_id", venue.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
