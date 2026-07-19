import { NextResponse } from "next/server";
import { revokeSession } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await revokeSession(req);
  return NextResponse.json({ ok: true });
}
