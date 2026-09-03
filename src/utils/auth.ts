import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

export type Role = "artist" | "venue" | "admin";

/** Roles a user may assign to themselves during onboarding. Admin is granted
 *  manually in the Clerk dashboard — never through the API. */
export const SELF_ASSIGNABLE_ROLES: Role[] = ["artist", "venue"];

export interface Session {
  userId: string;
  role: Role | undefined;
}

async function readSession(): Promise<Session | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  return { userId, role: user?.publicMetadata?.role as Role | undefined };
}

// ── API routes ──────────────────────────────────────────────────────────────

/** 401 response used when a request carries no valid session. */
export const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

/** 403 response used when a session exists but lacks the required role. */
export const forbidden = () =>
  NextResponse.json({ error: "Forbidden" }, { status: 403 });

/**
 * Guard for API routes. Returns the session, or a response to return as-is.
 *
 *   const guard = await requireRole("venue");
 *   if (guard instanceof NextResponse) return guard;
 *   const { userId } = guard;
 *
 * Pass no role to require only that the caller is signed in.
 */
export async function requireRole(
  ...roles: Role[]
): Promise<Session | NextResponse> {
  const session = await readSession();
  if (!session) return unauthorized();
  if (roles.length > 0 && (!session.role || !roles.includes(session.role))) {
    return forbidden();
  }
  return session;
}

// ── Server pages ────────────────────────────────────────────────────────────

/**
 * Guard for server pages. Redirects rather than returning a response:
 * signed out to /sign-in, no role yet to /onboarding, and wrong role to
 * that role's own dashboard.
 */
export async function requirePageRole(role: Role): Promise<Session> {
  const session = await readSession();
  if (!session) redirect("/sign-in");
  if (!session.role) redirect("/onboarding");
  if (session.role !== role) redirect(`/dashboard/${session.role}`);
  return session;
}
