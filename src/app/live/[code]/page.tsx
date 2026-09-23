import type { Metadata } from "next";
import { Suspense } from "react";
import LiveCodeClient from "./LiveCodeClient";

export const metadata: Metadata = {
  title: "Live game | AdvanceMe AI",
  description: "Live study game (demo)",
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
      <LiveCodeClient
        hostParam={first(sp.host)}
        setIdParam={first(sp.setId)}
      />
    </Suspense>
  );
}
