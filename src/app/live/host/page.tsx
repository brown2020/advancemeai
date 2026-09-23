import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Host a live game | AdvanceMe AI",
  description: "Host a live study game (demo)",
};

import LiveHostClient from "./LiveHostClient";

export default function Page() {
  return <LiveHostClient />;
}
