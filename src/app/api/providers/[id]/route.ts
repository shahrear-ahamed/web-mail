import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SmtpProvider } from "@/lib/models/SmtpProvider";
import { encrypt } from "@/lib/crypto";
import { headers } from "next/headers";

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  preset: z.enum(["gmail", "outlook", "custom"]).optional(),
  host: z.string().min(1).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  secure: z.boolean().optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  fromName: z.string().optional(),
  fromEmail: z.string().email().optional(),
  isDefault: z.boolean().optional(),
});

async function getSession() {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    await connectDB();
    const update: Record<string, unknown> = { ...parsed.data };

    if (parsed.data.password) {
      const { ciphertext, iv, authTag } = encrypt(parsed.data.password);
      update.passwordCiphertext = ciphertext;
      update.passwordIv = iv;
      update.passwordAuthTag = authTag;
      delete update.password;
    }

    if (parsed.data.isDefault) {
      await SmtpProvider.updateMany({ userId: session.user.id }, { isDefault: false });
    }

    const provider = await SmtpProvider.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      update,
      { new: true }
    ).select("-passwordCiphertext -passwordIv -passwordAuthTag");

    if (!provider) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(provider);
  } catch (err) {
    console.error("PUT /api/providers/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const result = await SmtpProvider.deleteOne({ _id: id, userId: session.user.id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("DELETE /api/providers/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
