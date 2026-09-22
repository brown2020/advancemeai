import type { Metadata } from "next";
import { Suspense } from "react";
import LiveCodeClient from "./LiveCodeClient";

export const metadata: Metadata = {
  title: "Live · code | AdvanceMe AI",
  description: "AdvanceMe AI — Live · code",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <LiveCodeClient />
    </Suspense>
  );
}
