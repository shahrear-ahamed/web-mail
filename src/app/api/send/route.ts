import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import nodemailer from "nodemailer";
import { createElement } from "react";
import { render } from "@react-email/render";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SmtpProvider } from "@/lib/models/SmtpProvider";
import { SentEmail } from "@/lib/models/SentEmail";
import { decrypt } from "@/lib/crypto";
import { getTemplate } from "@/lib/templates";
import { headers } from "next/headers";
import mongoose from "mongoose";

const SendSchema = z.object({
  providerId: z.string().min(1),
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).optional().default([]),
  bcc: z.array(z.string().email()).optional().default([]),
  subject: z.string().min(1).max(998),
  mode: z.enum(["richtext", "template"]),
  // richtext mode
  html: z.string().optional(),
  // template mode
  templateId: z.string().optional(),
  templateProps: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = SendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { providerId, to, cc, bcc, subject, mode, html, templateId, templateProps } =
    parsed.data;

  // Build HTML content
  let htmlContent: string;
  if (mode === "template") {
    if (!templateId) {
      return NextResponse.json({ error: "templateId required for template mode" }, { status: 422 });
    }
    const template = getTemplate(templateId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    const mergedProps = { ...template.defaultProps, ...(templateProps ?? {}) };
    htmlContent = await render(createElement(template.component, mergedProps));
  } else {
    if (!html) {
      return NextResponse.json({ error: "html required for richtext mode" }, { status: 422 });
    }
    htmlContent = html;
  }

  await connectDB();
  const provider = await SmtpProvider.findOne({ _id: providerId, userId: session.user.id });
  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

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

  const from = provider.fromName
    ? `"${provider.fromName}" <${provider.fromEmail}>`
    : provider.fromEmail;

  const start = Date.now();
  let smtpInfo: nodemailer.SentMessageInfo;
  try {
    smtpInfo = await transport.sendMail({ from, to, cc, bcc, subject, html: htmlContent });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Send failed";
    await SentEmail.create({
      userId: session.user.id,
      providerId: new mongoose.Types.ObjectId(providerId),
      providerSnapshot: { name: provider.name, host: provider.host, fromEmail: provider.fromEmail },
      to, cc, bcc, subject,
      htmlSnapshot: htmlContent,
      mode,
      ...(templateId ? { templateId, templateProps } : {}),
      smtpResponse: { messageId: "", response: "", accepted: [], rejected: to, latencyMs: Date.now() - start },
      status: "failed",
      errorMessage,
    });
    return NextResponse.json({ ok: false, error: errorMessage, latencyMs: Date.now() - start }, { status: 422 });
  }

  const latencyMs = Date.now() - start;
  const sentEmail = await SentEmail.create({
    userId: session.user.id,
    providerId: new mongoose.Types.ObjectId(providerId),
    providerSnapshot: { name: provider.name, host: provider.host, fromEmail: provider.fromEmail },
    to, cc, bcc, subject,
    htmlSnapshot: htmlContent,
    mode,
    ...(templateId ? { templateId, templateProps } : {}),
    smtpResponse: {
      messageId: smtpInfo.messageId ?? "",
      response: smtpInfo.response ?? "",
      accepted: smtpInfo.accepted ?? [],
      rejected: smtpInfo.rejected ?? [],
      latencyMs,
    },
    status: "sent",
  });

  return NextResponse.json({
    ok: true,
    sentEmailId: String(sentEmail._id),
    messageId: smtpInfo.messageId,
    accepted: smtpInfo.accepted,
    rejected: smtpInfo.rejected,
    latencyMs,
  });
}
