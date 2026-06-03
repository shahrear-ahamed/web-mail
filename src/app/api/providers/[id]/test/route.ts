import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SmtpProvider } from "@/lib/models/SmtpProvider";
import { decrypt } from "@/lib/crypto";
import { headers } from "next/headers";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const provider = await SmtpProvider.findOne({ _id: id, userId: session.user.id });
    if (!provider) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const password = decrypt({
      ciphertext: provider.passwordCiphertext,
      iv: provider.passwordIv,
      authTag: provider.passwordAuthTag,
    });

    const transport = nodemailer.createTransport({
      host: provider.host,
      port: provider.port,
      secure: provider.secure,
      auth: { user: provider.username, pass: password },
    });

    const start = Date.now();
    try {
      await transport.verify();
      return NextResponse.json({ ok: true, latencyMs: Date.now() - start });
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : "Connection failed", latencyMs: Date.now() - start },
        { status: 422 }
      );
    }
  } catch (err) {
    console.error("POST /api/providers/[id]/test error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
