"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────
interface SentEmailSummary {
  _id: string;
  subject: string;
  to: string[];
  status: "sent" | "failed";
  mode: "richtext" | "template";
  templateId?: string;
  providerSnapshot: { name: string; fromEmail: string };
  smtpResponse: { latencyMs: number; messageId: string };
  sentAt: string;
}

interface SentEmailDetail extends SentEmailSummary {
  cc: string[];
  bcc: string[];
  htmlSnapshot: string;
  templateProps?: Record<string, unknown>;
  errorMessage?: string;
  smtpResponse: {
    latencyMs: number;
    messageId: string;
    response: string;
    accepted: string[];
    rejected: string[];
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SentPage() {
  const [emails, setEmails] = useState<SentEmailSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SentEmailDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sent?page=${page}&limit=20`);
      const data = await res.json();
      setEmails(data.emails);
      setPagination(data.pagination);
    } catch {
      toast.error("Failed to load sent emails");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function openDetail(id: string) {
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/sent/${id}`);
      setDetail(await res.json());
    } catch {
      toast.error("Failed to load email details");
    } finally {
      setDetailLoading(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sent</h1>
        {pagination.total > 0 && (
          <span className="text-xs text-muted-foreground">{pagination.total} email{pagination.total !== 1 ? "s" : ""}</span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : emails.length === 0 ? (
        <div className="text-center py-16">
          <Mail className="size-8 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">No emails sent yet.</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border divide-y">
            {emails.map((e) => (
              <button
                key={e._id}
                className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-start gap-3"
                onClick={() => openDetail(e._id)}
              >
                <div className="mt-0.5 shrink-0">
                  {e.status === "sent" ? (
                    <CheckCircle2 className="size-4 text-green-500" />
                  ) : (
                    <XCircle className="size-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-medium text-sm truncate">{e.subject}</span>
                    {e.mode === "template" && e.templateId && (
                      <Badge variant="outline" className="text-[10px] shrink-0">{e.templateId}</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    To: {e.to.join(", ")} · via {e.providerSnapshot.name}
                  </div>
                </div>
                <div className="shrink-0 text-xs text-muted-foreground">{formatDate(e.sentAt)}</div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="gap-1"
              >
                <ChevronLeft className="size-3" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="gap-1"
              >
                Next <ChevronRight className="size-3" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="px-6 pt-6 pb-4">
            <SheetTitle className="truncate">{detail?.subject ?? "Email detail"}</SheetTitle>
          </SheetHeader>

          {detailLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
          ) : detail ? (
            <div className="space-y-4 px-6 pb-6 text-sm">
              {/* Meta */}
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs">
                <dt className="text-muted-foreground font-medium">Status</dt>
                <dd className={cn("font-medium", detail.status === "sent" ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                  {detail.status === "sent" ? "Delivered" : "Failed"}
                </dd>

                <dt className="text-muted-foreground font-medium">To</dt>
                <dd>{detail.to.join(", ")}</dd>

                {detail.cc.length > 0 && <>
                  <dt className="text-muted-foreground font-medium">CC</dt>
                  <dd>{detail.cc.join(", ")}</dd>
                </>}

                {detail.bcc.length > 0 && <>
                  <dt className="text-muted-foreground font-medium">BCC</dt>
                  <dd>{detail.bcc.join(", ")}</dd>
                </>}

                <dt className="text-muted-foreground font-medium">From</dt>
                <dd>{detail.providerSnapshot.fromEmail} ({detail.providerSnapshot.name})</dd>

                <dt className="text-muted-foreground font-medium">Mode</dt>
                <dd className="capitalize">{detail.mode}{detail.templateId ? ` — ${detail.templateId}` : ""}</dd>

                {detail.smtpResponse.messageId && <>
                  <dt className="text-muted-foreground font-medium">Message-ID</dt>
                  <dd className="font-mono truncate">{detail.smtpResponse.messageId}</dd>
                </>}

                <dt className="text-muted-foreground font-medium">Latency</dt>
                <dd>{detail.smtpResponse.latencyMs}ms</dd>

                {detail.errorMessage && <>
                  <dt className="text-muted-foreground font-medium">Error</dt>
                  <dd className="text-destructive">{detail.errorMessage}</dd>
                </>}
              </dl>

              <Separator />

              {/* HTML Preview */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
                <iframe
                  srcDoc={detail.htmlSnapshot}
                  sandbox="allow-same-origin"
                  className="w-full rounded-lg border bg-white"
                  style={{ height: 400 }}
                  title="Email preview"
                />
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
