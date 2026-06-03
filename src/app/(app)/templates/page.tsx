"use client";

import { useEffect, useState } from "react";
import { Eye, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────
interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  category: "transactional" | "marketing";
  fields: Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
    defaultValue?: unknown;
  }>;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data: TemplateMeta[]) => setTemplates(data))
      .catch(() => toast.error("Failed to load templates"))
      .finally(() => setLoading(false));
  }, []);

  async function openPreview(id: string) {
    setPreviewId(id);
    setPreviewHtml("");
    setPreviewing(true);
    try {
      const res = await fetch("/api/templates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: id }),
      });
      const data = await res.json();
      setPreviewHtml(data.html ?? "");
    } catch {
      toast.error("Failed to load preview");
    } finally {
      setPreviewing(false);
    }
  }

  const transactional = templates.filter((t) => t.category === "transactional");
  const marketing = templates.filter((t) => t.category === "marketing");

  function TemplateCard({ t }: { t: TemplateMeta }) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-tight">{t.name}</CardTitle>
            <Badge variant="secondary" className="text-[10px] shrink-0 capitalize">{t.category}</Badge>
          </div>
          <CardDescription className="text-xs">{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 justify-end gap-2 pb-4">
          <p className="text-xs text-muted-foreground">
            {t.fields.length} field{t.fields.length !== 1 ? "s" : ""}
            {" · "}
            {t.fields.filter((f) => f.required).length} required
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs flex-1"
              onClick={() => openPreview(t.id)}
            >
              <Eye className="size-3" /> Preview
            </Button>
            <Button
              size="sm"
              className="gap-1.5 text-xs flex-1"
              onClick={() => router.push(`/compose?template=${t.id}`)}
            >
              <Mail className="size-3" /> Use
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <h1 className="text-xl font-semibold">Email Templates</h1>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          {transactional.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Transactional</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {transactional.map((t) => <TemplateCard key={t.id} t={t} />)}
              </div>
            </section>
          )}

          {marketing.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Marketing</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketing.map((t) => <TemplateCard key={t.id} t={t} />)}
              </div>
            </section>
          )}
        </>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewId} onOpenChange={(open) => !open && setPreviewId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {templates.find((t) => t.id === previewId)?.name ?? "Preview"}
            </DialogTitle>
          </DialogHeader>

          {previewing ? (
            <div className="flex items-center justify-center h-[500px] text-sm text-muted-foreground">
              Rendering…
            </div>
          ) : (
            <iframe
              srcDoc={previewHtml}
              sandbox="allow-same-origin"
              className="w-full rounded-lg border bg-white"
              style={{ height: 500 }}
              title="Template preview"
            />
          )}

          <DialogFooter className="gap-2">
            <DialogClose render={<button className="hidden" />} />
            <Button variant="outline" onClick={() => setPreviewId(null)}>Close</Button>
            {previewId && (
              <Button
                onClick={() => {
                  router.push(`/compose?template=${previewId}`);
                  setPreviewId(null);
                }}
                className="gap-2"
              >
                <Mail className="size-4" /> Use template
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
