import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTemplates } from "@/lib/templates";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(getTemplates());
}
