import NewsletterEmail from "@/emails/NewsletterEmail";
import OtpEmail from "@/emails/OtpEmail";
import PasswordResetEmail from "@/emails/PasswordResetEmail";
import WelcomeEmail from "@/emails/WelcomeEmail";
import type { ComponentType } from "react";

export interface TemplateField {
  key: string;
  label: string;
  type: "string" | "number" | "url" | "array";
  required: boolean;
  defaultValue?: unknown;
  description?: string;
}

export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  category: "transactional" | "marketing";
  fields: TemplateField[];
}

export interface TemplateDefinition extends TemplateMeta {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultProps: Record<string, any>;
}

const templates: TemplateDefinition[] = [
  {
    id: "otp",
    name: "OTP / Verification Code",
    description: "One-time password email with a large, prominent code.",
    category: "transactional",
    fields: [
      { key: "otp", label: "OTP Code", type: "string", required: true, defaultValue: "123456" },
      { key: "appName", label: "App Name", type: "string", required: false, defaultValue: "Web Mail" },
      { key: "expiresInMinutes", label: "Expires In (minutes)", type: "number", required: false, defaultValue: 10 },
    ],
    component: OtpEmail,
    defaultProps: { otp: "123456", appName: "Web Mail", expiresInMinutes: 10 },
  },
  {
    id: "welcome",
    name: "Welcome Email",
    description: "Onboarding email for new users with a call-to-action button.",
    category: "transactional",
    fields: [
      { key: "name", label: "Recipient Name", type: "string", required: true, defaultValue: "there" },
      { key: "appName", label: "App Name", type: "string", required: false, defaultValue: "Web Mail" },
      { key: "ctaUrl", label: "CTA URL", type: "url", required: false, defaultValue: "https://example.com" },
    ],
    component: WelcomeEmail,
    defaultProps: { name: "there", appName: "Web Mail", ctaUrl: "https://example.com" },
  },
  {
    id: "password-reset",
    name: "Password Reset",
    description: "Password reset email with an expiring link.",
    category: "transactional",
    fields: [
      { key: "name", label: "Recipient Name", type: "string", required: false, defaultValue: "there" },
      { key: "resetUrl", label: "Reset URL", type: "url", required: true, defaultValue: "https://example.com/reset" },
      { key: "appName", label: "App Name", type: "string", required: false, defaultValue: "Web Mail" },
      { key: "expiresInMinutes", label: "Expires In (minutes)", type: "number", required: false, defaultValue: 30 },
    ],
    component: PasswordResetEmail,
    defaultProps: { name: "there", resetUrl: "https://example.com/reset", appName: "Web Mail", expiresInMinutes: 30 },
  },
  {
    id: "newsletter",
    name: "Newsletter",
    description: "Multi-article newsletter with optional hero image and unsubscribe link.",
    category: "marketing",
    fields: [
      { key: "title", label: "Newsletter Title", type: "string", required: true, defaultValue: "Monthly Newsletter" },
      { key: "issueNumber", label: "Issue Number", type: "number", required: false, defaultValue: 1 },
      { key: "previewText", label: "Preview Text", type: "string", required: false },
      { key: "heroImageUrl", label: "Hero Image URL", type: "url", required: false },
      { key: "unsubscribeUrl", label: "Unsubscribe URL", type: "url", required: false, defaultValue: "https://example.com/unsubscribe" },
      {
        key: "articles",
        label: "Articles (JSON array)",
        type: "array",
        required: false,
        description: 'Array of { heading, summary, ctaUrl, ctaLabel? }',
        defaultValue: [{ heading: "Article Heading", summary: "Brief summary.", ctaUrl: "https://example.com", ctaLabel: "Read more" }],
      },
    ],
    component: NewsletterEmail,
    defaultProps: {
      title: "Monthly Newsletter",
      issueNumber: 1,
      articles: [{ heading: "Article Heading", summary: "Brief summary.", ctaUrl: "https://example.com", ctaLabel: "Read more" }],
      unsubscribeUrl: "https://example.com/unsubscribe",
    },
  },
];

export function getTemplates(): TemplateMeta[] {
  return templates.map(({ component: _c, defaultProps: _d, ...meta }) => meta);
}

export function getTemplate(id: string): TemplateDefinition | undefined {
  return templates.find((t) => t.id === id);
}
