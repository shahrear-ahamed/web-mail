import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/render";
import { createElement } from "react";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getTemplate } from "@/lib/templates";
import { headers } from "next/headers";

const PreviewSchema = z.object({
  templateId: z.string().min(1),
  props: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = PreviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { templateId, props } = parsed.data;
  const template = getTemplate(templateId);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const mergedProps = { ...template.defaultProps, ...props };
  const html = await render(createElement(template.component, mergedProps));

  return NextResponse.json({ html });
}
