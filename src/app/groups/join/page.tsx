import type { Metadata } from "next";
import { Suspense } from "react";
import JoinGroupClient from "./JoinGroupClient";

export const metadata: Metadata = {
  title: "Join a class | AdvanceMe AI",
  description: "Join a class with an invite code",
};

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <JoinGroupClient codeParam={first(sp.code)} />
    </Suspense>
  );
}
