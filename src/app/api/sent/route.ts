import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SentEmail } from "@/lib/models/SentEmail";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;

  await connectDB();

  const [emails, total] = await Promise.all([
    SentEmail.find({ userId: session.user.id })
      .select("-htmlSnapshot")
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SentEmail.countDocuments({ userId: session.user.id }),
  ]);

  return NextResponse.json({
    emails,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
