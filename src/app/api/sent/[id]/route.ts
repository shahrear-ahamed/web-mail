import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SentEmail } from "@/lib/models/SentEmail";
import { headers } from "next/headers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const email = await SentEmail.findOne({ _id: id, userId: session.user.id }).lean();
  if (!email) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(email);
}
