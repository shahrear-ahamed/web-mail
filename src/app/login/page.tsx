"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  function authError(error: { message?: string; statusText?: string; status?: number }) {
    if (error.message) return error.message;
    if (error.status === 409) return "An account with this email already exists";
    if (error.status === 401) return "Incorrect email or password";
    if (error.status === 422) return "Invalid email or password";
    return error.statusText || "Something went wrong";
  }

  async function handleEmailPassword(mode: "signIn" | "signUp") {
    setLoading(true);
    try {
      if (mode === "signUp") {
        const { error } = await authClient.signUp.email({ email, password, name });
        if (error) { toast.error(authError(error)); return; }
        toast.success("Account created — signing you in…");
      }
      const { error } = await authClient.signIn.email({ email, password });
      if (error) { toast.error(authError(error)); return; }
      router.push(next);
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    setLoading(true);
    try {
      const { error } = await authClient.signIn.magicLink({ email });
      if (error) throw new Error(error.message);
      setMagicSent(true);
      toast.success("Magic link sent — check your inbox");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send magic link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Mail className="size-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Web Mail</CardTitle>
          <CardDescription>SMTP tester &amp; email client</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="signin" className="flex-1">Sign in</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">Sign up</TabsTrigger>
              <TabsTrigger value="magic" className="flex-1">Magic link</TabsTrigger>
            </TabsList>

            {/* Sign in */}
            <TabsContent value="signin" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="si-email">Email</Label>
                <Input
                  id="si-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="si-password">Password</Label>
                <PasswordInput
                  id="si-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => handleEmailPassword("signIn")}
                disabled={loading || !email || !password}
              >
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </TabsContent>

            {/* Sign up */}
            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="su-name">Name</Label>
                <Input
                  id="su-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-email">Email</Label>
                <Input
                  id="su-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-password">Password</Label>
                <PasswordInput
                  id="su-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => handleEmailPassword("signUp")}
                disabled={loading || !email || !password || !name}
              >
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </TabsContent>

            {/* Magic link */}
            <TabsContent value="magic" className="space-y-4">
              {magicSent ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Check <strong>{email}</strong> for a sign-in link.
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="ml-email">Email</Label>
                    <Input
                      id="ml-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleMagicLink}
                    disabled={loading || !email}
                  >
                    {loading ? "Sending…" : "Send magic link"}
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
