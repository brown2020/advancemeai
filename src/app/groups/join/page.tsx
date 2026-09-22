import type { Metadata } from "next";
import { Suspense } from "react";
import JoinGroupClient from "./JoinGroupClient";

export const metadata: Metadata = {
  title: "Groups · join | AdvanceMe AI",
  description: "AdvanceMe AI — Groups · join",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <JoinGroupClient />
    </Suspense>
  );
}
