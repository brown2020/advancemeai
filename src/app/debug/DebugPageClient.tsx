"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bug, Cookie, FlaskConical } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/common/UIComponents";

function StatusRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-all text-sm font-medium">{children}</dd>
    </div>
  );
}

export default function DebugPageClient() {
  const { user, isLoading } = useAuth();
  const [cookies, setCookies] = useState("");

  const readCookies = () => setCookies(document.cookie);

  useEffect(() => {
    readCookies();
  }, []);

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Developer tools"
        title="Auth debug"
        description="Inspect the current session and jump into practice with or without the test flag."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="size-5 text-primary" aria-hidden />
            Authentication status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <StatusRow label="Loading">
              <Badge variant={isLoading ? "warning" : "secondary"}>
                {isLoading ? "Yes" : "No"}
              </Badge>
            </StatusRow>
            <StatusRow label="User">
              {user ? (
                <Badge variant="success">Signed in as {user.email}</Badge>
              ) : (
                <Badge variant="outline">Not signed in</Badge>
              )}
            </StatusRow>
            <StatusRow label="Cookies">
              <code className="font-mono text-xs">{cookies || "None"}</code>
            </StatusRow>
          </dl>
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Auth actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button onClick={readCookies} variant="outline">
              <Cookie aria-hidden />
              Re-read cookies
            </Button>
            <Link href="/auth/signin" className={buttonVariants()}>
              Sign in
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link href="/practice" className={buttonVariants({ variant: "outline" })}>
              Practice (normal)
            </Link>
            <Link
              href="/practice?test=true"
              className={buttonVariants({ variant: "outline" })}
            >
              <FlaskConical aria-hidden />
              Practice (test flag)
            </Link>
            <Link href="/" className={buttonVariants({ variant: "ghost" })}>
              Back to home
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How to debug</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Check your authentication status above.</li>
            <li>If you&apos;re not signed in, use the Sign in button.</li>
            <li>Open the Practice page with one of the navigation buttons.</li>
            <li>If you&apos;re still redirected, try the test-flag option.</li>
            <li>Check the browser console for errors.</li>
          </ol>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
