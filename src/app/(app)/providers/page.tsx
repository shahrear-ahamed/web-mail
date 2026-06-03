"use client";

import { PasswordInput } from "@/components/password-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CheckCircle2, Pencil, Plus, Star, Trash2, Wifi, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ── Types ───────────────────────────────────────────────────────────────────
interface Provider {
  _id: string;
  name: string;
  preset: "gmail" | "outlook" | "custom";
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromName?: string;
  fromEmail: string;
  isDefault: boolean;
}

interface FormState {
  name: string;
  preset: "gmail" | "outlook" | "custom";
  host: string;
  port: string;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  isDefault: boolean;
}

type TestResult = { ok: boolean; latencyMs?: number; error?: string } | null;

// ── Presets ─────────────────────────────────────────────────────────────────
const PRESETS: Record<"gmail" | "outlook", { host: string; port: number; secure: boolean }> = {
  gmail: { host: "smtp.gmail.com", port: 587, secure: false },
  outlook: { host: "smtp-mail.outlook.com", port: 587, secure: false },
};

function emptyForm(): FormState {
  return {
    name: "",
    preset: "gmail",
    host: PRESETS.gmail.host,
    port: String(PRESETS.gmail.port),
    secure: PRESETS.gmail.secure,
    username: "",
    password: "",
    fromName: "",
    fromEmail: "",
    isDefault: false,
  };
}

function providerToForm(p: Provider): FormState {
  return {
    name: p.name,
    preset: p.preset,
    host: p.host,
    port: String(p.port),
    secure: p.secure,
    username: p.username,
    password: "",
    fromName: p.fromName ?? "",
    fromEmail: p.fromEmail,
    isDefault: p.isDefault,
  };
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testing, setTesting] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ── Data ─────────────────────────────────────────────────────────────────
  async function load() {
    try {
      const res = await fetch("/api/providers");
      setProviders(await res.json());
    } catch {
      toast.error("Failed to load providers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ── Sheet helpers ─────────────────────────────────────────────────────────
  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setSheetOpen(true);
  }

  function openEdit(p: Provider) {
    setEditingId(p._id);
    setForm(providerToForm(p));
    setSheetOpen(true);
  }

  function handlePresetChange(preset: "gmail" | "outlook" | "custom") {
    set("preset", preset);
    if (preset !== "custom") {
      const p = PRESETS[preset];
      setForm((prev) => ({ ...prev, preset, host: p.host, port: String(p.port), secure: p.secure }));
    } else {
      setForm((prev) => ({ ...prev, preset: "custom" }));
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (!form.username.trim()) { toast.error("Username is required"); return; }
    if (!editingId && !form.password.trim()) { toast.error("Password is required"); return; }
    if (!form.fromEmail.trim()) { toast.error("From email is required"); return; }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        preset: form.preset,
        host: form.host,
        port: Number(form.port),
        secure: form.secure,
        username: form.username,
        fromName: form.fromName || undefined,
        fromEmail: form.fromEmail,
        isDefault: form.isDefault,
      };
      if (form.password) body.password = form.password;

      const res = await fetch(editingId ? `/api/providers/${editingId}` : "/api/providers", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error?.fieldErrors ? "Validation error" : d.error ?? "Save failed");
        return;
      }

      toast.success(editingId ? "Provider updated" : "Provider added");
      setSheetOpen(false);
      await load();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteId) return;
    try {
      await fetch(`/api/providers/${deleteId}`, { method: "DELETE" });
      toast.success("Provider deleted");
      setDeleteId(null);
      await load();
    } catch {
      toast.error("Delete failed");
    }
  }

  // ── Test ──────────────────────────────────────────────────────────────────
  async function handleTest(id: string) {
    setTesting(id);
    setTestResults((prev) => ({ ...prev, [id]: null }));
    try {
      const res = await fetch(`/api/providers/${id}/test`, { method: "POST" });
      const data = await res.json();
      setTestResults((prev) => ({ ...prev, [id]: data }));
      if (data.ok) toast.success(`Connected in ${data.latencyMs}ms`);
      else toast.error(data.error ?? "Connection failed");
    } catch {
      toast.error("Test request failed");
    } finally {
      setTesting(null);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">SMTP Providers</h1>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="size-4" />
          Add provider
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : providers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm mb-4">No providers yet. Add one to start sending emails.</p>
            <Button onClick={openAdd} variant="outline" className="gap-2">
              <Plus className="size-4" /> Add your first provider
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {providers.map((p) => {
            const tr = testResults[p._id];
            return (
              <Card key={p._id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    {p.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                    {tr && (
                      <Badge
                        variant={tr.ok ? "secondary" : "destructive"}
                        className={cn("text-xs", tr.ok && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400")}
                      >
                        {tr.ok ? <><CheckCircle2 className="size-3 mr-1" />{tr.latencyMs}ms</> : <><XCircle className="size-3 mr-1" />Failed</>}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    {p.fromName ? `"${p.fromName}" <${p.fromEmail}>` : p.fromEmail}
                    {" · "}{p.host}:{p.port}{p.secure ? " (TLS)" : " (STARTTLS)"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2 pt-0 pb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => handleTest(p._id)}
                    disabled={testing === p._id}
                  >
                    <Wifi className="size-3" />
                    {testing === p._id ? "Testing…" : "Test"}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => openEdit(p)}>
                    <Pencil className="size-3" /> Edit
                  </Button>
                  {!p.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={async () => {
                        await fetch(`/api/providers/${p._id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ isDefault: true }),
                        });
                        await load();
                        toast.success("Set as default");
                      }}
                    >
                      <Star className="size-3" /> Set default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(p._id)}
                  >
                    <Trash2 className="size-3" /> Delete
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? "Edit Provider" : "Add Provider"}</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 py-4 px-3">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Name</Label>
              <Input id="p-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="My Gmail" />
            </div>

            {/* Preset */}
            <div className="space-y-1.5">
              <Label>Preset</Label>
              <Select value={form.preset} onValueChange={(v) => v && handlePresetChange(v as "gmail" | "outlook" | "custom")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmail">Gmail</SelectItem>
                  <SelectItem value="outlook">Outlook / Hotmail</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Host + Port */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="p-host">SMTP Host</Label>
                <Input id="p-host" value={form.host} onChange={(e) => set("host", e.target.value)} placeholder="smtp.example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-port">Port</Label>
                <Input id="p-port" type="number" value={form.port} onChange={(e) => set("port", e.target.value)} />
              </div>
            </div>

            {/* Secure toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="p-secure"
                checked={form.secure}
                onChange={(e) => set("secure", e.target.checked)}
                className="size-4 rounded"
              />
              <Label htmlFor="p-secure" className="cursor-pointer">Use TLS (port 465)</Label>
            </div>

            {/* Username + Password */}
            <div className="space-y-1.5">
              <Label htmlFor="p-user">Username / Email</Label>
              <Input id="p-user" value={form.username} onChange={(e) => set("username", e.target.value)} placeholder="you@gmail.com" autoComplete="off" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-pass">
                {editingId ? "Password (leave blank to keep)" : "Password"}
              </Label>
              <PasswordInput
                id="p-pass"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder={editingId ? "••••••••" : "App password or SMTP password"}
                autoComplete="new-password"
              />
            </div>

            {/* From */}
            <div className="space-y-1.5">
              <Label htmlFor="p-fname">From Name (optional)</Label>
              <Input id="p-fname" value={form.fromName} onChange={(e) => set("fromName", e.target.value)} placeholder="Alice" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-femail">From Email</Label>
              <Input id="p-femail" type="email" value={form.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} placeholder="you@example.com" />
            </div>

            {/* Default */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="p-default"
                checked={form.isDefault}
                onChange={(e) => set("isDefault", e.target.checked)}
                className="size-4 rounded"
              />
              <Label htmlFor="p-default" className="cursor-pointer">Set as default provider</Label>
            </div>
          </div>

          <SheetFooter>
            <SheetClose render={<button className="hidden" />} />
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Add provider"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete provider?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This cannot be undone. Any scheduled sends using this provider will fail.
          </p>
          <DialogFooter>
            <DialogClose render={<button className="hidden" />} />
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
