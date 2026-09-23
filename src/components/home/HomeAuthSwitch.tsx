"use client";

import { useAuth } from "@/lib/auth";
import { HomeDashboardClient } from "./HomeDashboardClient";

/**
 * The server couldn't verify a session (e.g. admin SDK not configured), but the
 * client may still be signed in. Show the dashboard in that case, otherwise the
 * server-rendered landing page.
 */
export function HomeAuthSwitch({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user) return <HomeDashboardClient />;
  return <>{children}</>;
}
