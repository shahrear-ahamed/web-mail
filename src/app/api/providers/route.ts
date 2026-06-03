import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SmtpProvider } from "@/lib/models/SmtpProvider";
import { encrypt } from "@/lib/crypto";
import { headers } from "next/headers";

const ProviderSchema = z.object({
  name: z.string().min(1).max(100),
  preset: z.enum(["gmail", "outlook", "custom"]),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean(),
  username: z.string().min(1),
  password: z.string().min(1),
  fromName: z.string().optional(),
  fromEmail: z.string().email(),
  isDefault: z.boolean().optional().default(false),
});

async function getSession() {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const providers = await SmtpProvider.find({ userId: session.user.id })
      .select("-passwordCiphertext -passwordIv -passwordAuthTag")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(providers);
  } catch (err) {
    console.error("GET /api/providers error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const parsed = ProviderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const { password, ...rest } = parsed.data;
    const { ciphertext, iv, authTag } = encrypt(password);

    await connectDB();

    if (rest.isDefault) {
      await SmtpProvider.updateMany({ userId: session.user.id }, { isDefault: false });
    }

    const provider = await SmtpProvider.create({
      ...rest,
      userId: session.user.id,
      passwordCiphertext: ciphertext,
      passwordIv: iv,
      passwordAuthTag: authTag,
    });

    const { passwordCiphertext: _c, passwordIv: _i, passwordAuthTag: _a, ...safe } =
      provider.toObject();
    return NextResponse.json(safe, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /api/providers error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
