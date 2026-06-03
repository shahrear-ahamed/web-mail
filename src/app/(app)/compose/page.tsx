"use client";

import { RichTextEditor } from "@/components/rich-text-editor";
import { TagInput } from "@/components/tag-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronDown, ChevronUp, Send, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ── Local types (mirrors API responses) ────────────────────────────────────
interface Provider {
  _id: string;
  name: string;
  fromEmail: string;
  fromName?: string;
  isDefault: boolean;
}

interface TemplateField {
  key: string;
  label: string;
  type: "string" | "number" | "url" | "array";
  required: boolean;
  defaultValue?: unknown;
  description?: string;
}

interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  category: "transactional" | "marketing";
  fields: TemplateField[];
}

interface SendResult {
  ok: boolean;
  sentEmailId?: string;
  messageId?: string;
  accepted?: string[];
  rejected?: string[];
  latencyMs?: number;
  error?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function defaultForField(f: TemplateField): string {
  if (f.defaultValue == null) return "";
  if (Array.isArray(f.defaultValue)) return "";
  return String(f.defaultValue);
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ComposePage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [providerId, setProviderId] = useState("");
  const [mode, setMode] = useState<"richtext" | "template">("richtext");
  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [templateProps, setTemplateProps] = useState<Record<string, string>>({});
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);

  const searchParams = useSearchParams();

  // ── Fetch data ──────────────────────────────────────────────────────────
  useEffect(() => {
    const templateParam = searchParams.get("template");

    fetch("/api/providers")
      .then((r) => r.json())
      .then((data: Provider[]) => {
        setProviders(data);
        const def = data.find((p) => p.isDefault) ?? data[0];
        if (def) setProviderId(def._id);
      })
      .catch(() => toast.error("Failed to load providers"));

    fetch("/api/templates")
      .then((r) => r.json())
      .then((data: TemplateMeta[]) => {
        setTemplates(data);
        if (templateParam) {
          setMode("template");
          const tpl = data.find((t) => t.id === templateParam);
          if (tpl) {
            setTemplateId(templateParam);
            const defaults: Record<string, string> = {};
            tpl.fields.forEach((f) => {
              if (f.type !== "array") defaults[f.key] = defaultForField(f);
            });
            setTemplateProps(defaults);
          }
        }
      })
      .catch(() => toast.error("Failed to load templates"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Template field init ─────────────────────────────────────────────────
  function selectTemplate(id: string) {
    setTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    const defaults: Record<string, string> = {};
    tpl.fields.forEach((f) => {
      if (f.type !== "array") defaults[f.key] = defaultForField(f);
    });
    setTemplateProps(defaults);
  }

  // ── Send ────────────────────────────────────────────────────────────────
  async function handleSend() {
    if (!providerId) { toast.error("Select a provider first"); return; }
    if (to.length === 0) { toast.error("Add at least one recipient"); return; }
    if (!subject.trim()) { toast.error("Subject is required"); return; }
    if (mode === "richtext" && !html.replace(/<[^>]*>/g, "").trim()) {
      toast.error("Message body is empty"); return;
    }
    if (mode === "template" && !templateId) { toast.error("Select a template"); return; }

    setSending(true);
    setResult(null);
    try {
      const body: Record<string, unknown> = {
        providerId,
        to,
        cc: cc.length ? cc : undefined,
        bcc: bcc.length ? bcc : undefined,
        subject,
        mode,
      };
      if (mode === "richtext") {
        body.html = html;
      } else {
        body.templateId = templateId;
        // Convert string values back to proper types for template props
        const tpl = templates.find((t) => t.id === templateId);
        const converted: Record<string, unknown> = {};
        tpl?.fields.forEach((f) => {
          const v = templateProps[f.key];
          if (v === undefined || v === "") return;
          converted[f.key] = f.type === "number" ? Number(v) : v;
        });
        body.templateProps = converted;
      }

      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: SendResult = await res.json();
      setResult(data);
      if (data.ok) {
        toast.success(`Sent in ${data.latencyMs}ms`);
      } else {
        toast.error(data.error ?? "Send failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSending(false);
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────
  const selectedProvider = providers.find((p) => p._id === providerId);
  const selectedTemplate = templates.find((t) => t.id === templateId);
  const canSend =
    !!providerId &&
    to.length > 0 &&
    !!subject.trim() &&
    !sending &&
    (mode === "richtext" ? !!html.replace(/<[^>]*>/g, "").trim() : !!templateId);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-xl font-semibold">Compose</h1>

      {/* Provider + Mode */}
      <div className="flex gap-3 items-start flex-wrap">
        <div className="flex-1 min-w-48 space-y-1.5">
          <Label>From (provider)</Label>
          <Select value={providerId} onValueChange={(v) => setProviderId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder={providers.length === 0 ? "No providers — add one first" : "Select provider…"}>
                {(value: string) => providers.find((p) => p._id === value)?.name ?? value}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p._id} value={p._id} label={p.name}>
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    {p.fromName ? `"${p.fromName}" <${p.fromEmail}>` : p.fromEmail}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Mode</Label>
          <Tabs value={mode} onValueChange={(v) => setMode(v as "richtext" | "template")}>
            <TabsList>
              <TabsTrigger value="richtext">Rich Text</TabsTrigger>
              <TabsTrigger value="template">Template</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <Separator />

      {/* Recipients */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>To</Label>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => setShowCc((v) => !v)}
                className={cn("hover:text-foreground transition-colors", showCc && "text-foreground")}
              >
                CC {showCc ? <ChevronUp className="inline size-3" /> : <ChevronDown className="inline size-3" />}
              </button>
              <button
                type="button"
                onClick={() => setShowBcc((v) => !v)}
                className={cn("hover:text-foreground transition-colors", showBcc && "text-foreground")}
              >
                BCC {showBcc ? <ChevronUp className="inline size-3" /> : <ChevronDown className="inline size-3" />}
              </button>
            </div>
          </div>
          <TagInput value={to} onChange={setTo} placeholder="recipient@example.com" />
        </div>

        {showCc && (
          <div className="space-y-1.5">
            <Label>CC</Label>
            <TagInput value={cc} onChange={setCc} placeholder="cc@example.com" />
          </div>
        )}

        {showBcc && (
          <div className="space-y-1.5">
            <Label>BCC</Label>
            <TagInput value={bcc} onChange={setBcc} placeholder="bcc@example.com" />
          </div>
        )}
      </div>

      {/* Subject */}
      <div className="space-y-1.5">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject"
        />
      </div>

      <Separator />

      {/* Body */}
      {mode === "richtext" ? (
        <div className="space-y-1.5">
          <Label>Message</Label>
          <RichTextEditor onChange={setHtml} placeholder="Write your message…" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Template</Label>
            <Select value={templateId} onValueChange={(v) => v && selectTemplate(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template…">
                  {(value: string) => templates.find((t) => t.id === value)?.name ?? value}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
            )}
          </div>

          {selectedTemplate && selectedTemplate.fields.filter((f) => f.type !== "array").length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedTemplate.fields
                .filter((f) => f.type !== "array")
                .map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label htmlFor={`tprop-${field.key}`}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-0.5">*</span>}
                    </Label>
                    <Input
                      id={`tprop-${field.key}`}
                      type={field.type === "number" ? "number" : field.type === "url" ? "url" : "text"}
                      value={templateProps[field.key] ?? ""}
                      onChange={(e) =>
                        setTemplateProps((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.description ?? field.label}
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Send */}
      <div className="flex items-center gap-4 pt-2">
        <Button onClick={handleSend} disabled={!canSend} className="gap-2">
          <Send className="size-4" />
          {sending ? "Sending…" : "Send"}
        </Button>
        {selectedProvider && (
          <span className="text-xs text-muted-foreground">
            via <span className="font-medium">{selectedProvider.name}</span>
          </span>
        )}
      </div>

      {/* Result Panel */}
      {result && (
        <Card className={cn(result.ok ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : "border-destructive/50 bg-destructive/5")}>
          <CardHeader className="pb-2">
            <CardTitle className={cn("text-sm flex items-center gap-2", result.ok ? "text-green-700 dark:text-green-400" : "text-destructive")}>
              {result.ok
                ? <><CheckCircle2 className="size-4" /> Delivered</>
                : <><XCircle className="size-4" /> Failed</>}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1 text-muted-foreground font-mono">
            {result.ok ? (
              <>
                {result.messageId && <div>Message-ID: {result.messageId}</div>}
                {result.accepted && result.accepted.length > 0 && (
                  <div>Accepted: {result.accepted.join(", ")}</div>
                )}
                {result.rejected && result.rejected.length > 0 && (
                  <div className="text-destructive">Rejected: {result.rejected.join(", ")}</div>
                )}
                {result.latencyMs != null && <div>Latency: {result.latencyMs}ms</div>}
              </>
            ) : (
              <div className="text-destructive">{result.error}</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
